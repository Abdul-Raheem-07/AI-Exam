<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use RuntimeException;

class GeminiService
{
    public function generateMcqs(string $material, int $count, string $difficulty = 'Moderate', ?UploadedFile $source = null): array
    {
        if (!trim($material) && !$source) throw new RuntimeException('Study material is required.');
        $prompt = "You are an expert assessment writer. Use ONLY the supplied study material. Generate exactly {$count} learning-focused multiple-choice questions at {$difficulty} difficulty. Mix conceptual and application questions. Do not test unrelated topics. Return ONLY valid JSON in this shape: {\"questions\":[{\"question\":\"...\",\"options\":{\"A\":\"...\",\"B\":\"...\",\"C\":\"...\",\"D\":\"...\"},\"correct_answer\":\"A\",\"explanation\":\"...\"}]}." . (trim($material) ? " Study material text:\n" . mb_substr($material, 0, 50000) : ' The attached file is the study material.');
        $parts = [['text' => $prompt]];
        if ($source && $source->getMimeType() === 'application/pdf') $parts[] = ['inline_data' => ['mime_type' => 'application/pdf', 'data' => base64_encode(file_get_contents($source->getRealPath()))]];
        if ($source && $source->getMimeType() === 'text/plain') $parts[0]['text'] .= "\nAttached text:\n" . mb_substr((string) file_get_contents($source->getRealPath()), 0, 50000);
        if ($source && str_contains($source->getMimeType(), 'wordprocessingml')) $parts[0]['text'] .= "\nAttached DOCX text:\n" . mb_substr($this->extractDocxText($source), 0, 50000);
        $payload = ['contents' => [['parts' => $parts]], 'generationConfig' => ['responseMimeType' => 'application/json']];
        $response = Http::timeout(60)->retry(2, 500)->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=' . urlencode((string) config('services.gemini.key')), $payload);
        if (!$response->successful()) throw new RuntimeException('Gemini API is unavailable.');
        $text = data_get($response->json(), 'candidates.0.content.parts.0.text');
        if (!is_string($text)) throw new RuntimeException('Gemini returned an empty response.');
        $decoded = json_decode(trim($text), true);
        if (!is_array($decoded)) throw new RuntimeException('Gemini returned malformed JSON.');
        return $this->validateMcqs($decoded, $count);
    }

    public function evaluateHandwritten(array $files, array $exam): array
    {
        if (!$files) throw new RuntimeException('No answer-sheet files were provided.');
        $parts = [];
        foreach ($files as $file) {
            $path = is_array($file) ? ($file['path'] ?? null) : $file;
            if (!$path || !Storage::disk('local')->exists($path)) throw new RuntimeException('An answer-sheet file is unavailable.');
            $contents = Storage::disk('local')->get($path);
            $mime = Storage::disk('local')->mimeType($path) ?: 'application/octet-stream';
            $parts[] = ['inline_data' => ['mime_type' => $mime, 'data' => base64_encode($contents)]];
        }
        $questions = collect($exam['questions'] ?? [])->values()->map(fn ($question, $index) => 'Q' . ($index + 1) . ': ' . ($question['question'] ?? $question['questionText'] ?? '') . ' (Max marks: ' . ($question['marks'] ?? $question['maxMarks'] ?? 0) . ')')->implode("\n");
        $prompt = "Evaluate the handwritten answer sheets against this exam. Return ONLY JSON: {\"score\":number,\"maximum_marks\":number,\"feedback\":[{\"question\":number,\"score\":number,\"remarks\":string}],\"strengths\":[string],\"weaknesses\":[string],\"suggestions\":[string],\"confidence\":number}. Do not invent questions. Exam title: " . ($exam['title'] ?? '') . "\nRubric: " . ($exam['rubric'] ?? '') . "\nQuestions:\n" . $questions;
        array_unshift($parts, ['text' => $prompt]);
        $payload = ['contents' => [['parts' => $parts]], 'generationConfig' => ['responseMimeType' => 'application/json']];
        $response = Http::timeout(120)->retry(2, 1000)->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=' . urlencode((string) config('services.gemini.key')), $payload);
        if (!$response->successful()) throw new RuntimeException('Gemini evaluation API is unavailable.');
        $text = data_get($response->json(), 'candidates.0.content.parts.0.text');
        $decoded = is_string($text) ? json_decode(trim($text), true) : null;
        if (!is_array($decoded)) throw new RuntimeException('Gemini evaluation returned malformed JSON.');
        return $this->validateEvaluation($decoded);
    }

    private function validateMcqs(array $payload, int $requestedCount): array
    {
        $questions = $payload['questions'] ?? null;
        if (!is_array($questions) || count($questions) !== $requestedCount) throw new RuntimeException('Gemini returned an invalid question count.');
        $seen = [];
        foreach ($questions as $question) {
            if (!is_array($question) || !is_string($question['question'] ?? null) || !is_string($question['explanation'] ?? null)) throw new RuntimeException('Gemini returned a malformed question.');
            if (isset($question['answer_text']) || isset($question['written_answer'])) throw new RuntimeException('Generated questions must be multiple-choice only.');
            $options = $question['options'] ?? null;
            if (!is_array($options) || array_keys($options) !== ['A', 'B', 'C', 'D'] || count(array_filter($options, fn ($option) => is_string($option) && trim($option) !== '')) !== 4) throw new RuntimeException('Each question must contain exactly four options.');
            $correct = $question['correct_answer'] ?? null;
            if (!is_string($correct) || !in_array($correct, ['A', 'B', 'C', 'D'], true) || !array_key_exists($correct, $options)) throw new RuntimeException('A correct answer did not match an option.');
            $key = mb_strtolower(preg_replace('/[^a-z0-9]+/i', '', $question['question']));
            if (isset($seen[$key])) throw new RuntimeException('Gemini returned duplicate questions.');
            $seen[$key] = true;
        }
        return $questions;
    }

    private function validateEvaluation(array $result): array
    {
        foreach (['score', 'maximum_marks', 'feedback', 'strengths', 'weaknesses', 'suggestions'] as $key) if (!array_key_exists($key, $result)) throw new RuntimeException('Gemini evaluation is missing required fields.');
        if (!is_numeric($result['score']) || !is_numeric($result['maximum_marks']) || $result['score'] < 0 || $result['maximum_marks'] < 0 || !is_array($result['feedback']) || !is_array($result['strengths']) || !is_array($result['weaknesses']) || !is_array($result['suggestions'])) throw new RuntimeException('Gemini evaluation has invalid fields.');
        foreach ($result['feedback'] as $item) if (!is_array($item) || !isset($item['question'], $item['score'], $item['remarks']) || !is_numeric($item['question']) || !is_numeric($item['score']) || !is_string($item['remarks'])) throw new RuntimeException('Gemini question feedback is invalid.');
        $result['score'] = (float) $result['score'];
        $result['maximum_marks'] = (float) $result['maximum_marks'];
        return $result;
    }

    private function extractDocxText(UploadedFile $source): string
    {
        $zip = new \ZipArchive();
        if ($zip->open($source->getRealPath()) !== true) throw new RuntimeException('The DOCX study material could not be read.');
        $xml = $zip->getFromName('word/document.xml');
        $zip->close();
        if (!is_string($xml)) throw new RuntimeException('The DOCX study material has no readable document body.');
        return trim(preg_replace('/\s+/', ' ', strip_tags(str_replace(['</w:p>', '</w:tr>'], "\n", $xml))));
    }
}
