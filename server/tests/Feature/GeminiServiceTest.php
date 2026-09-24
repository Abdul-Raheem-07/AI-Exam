<?php

namespace Tests\Feature;

use App\Services\GeminiService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use RuntimeException;

class GeminiServiceTest extends TestCase
{
    public function test_gemini_mcq_response_is_validated_before_use(): void
    {
        config(['services.gemini.key' => 'test-key']);
        $questions = collect(range(1, 10))->map(fn ($number) => ['question' => "Question {$number}", 'options' => ['A' => 'One', 'B' => 'Two', 'C' => 'Three', 'D' => 'Four'], 'correct_answer' => 'A', 'explanation' => 'Because A.'])->all();
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response(['candidates' => [['content' => ['parts' => [['text' => json_encode(['questions' => $questions])]]]]]], 200)]);
        $result = app(GeminiService::class)->generateMcqs('A sufficiently long study material for testing.', 10);
        $this->assertCount(10, $result);
    }

    public function test_duplicate_mcqs_are_rejected(): void
    {
        config(['services.gemini.key' => 'test-key']);
        $question = ['question' => 'Same question', 'options' => ['A' => 'One', 'B' => 'Two', 'C' => 'Three', 'D' => 'Four'], 'correct_answer' => 'A', 'explanation' => 'Because A.'];
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response(['candidates' => [['content' => ['parts' => [['text' => json_encode(['questions' => array_fill(0, 10, $question)])]]]]]], 200)]);
        $this->expectException(RuntimeException::class);
        app(GeminiService::class)->generateMcqs('A sufficiently long study material for testing.', 10);
    }
}
