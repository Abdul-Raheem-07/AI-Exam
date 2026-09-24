<?php

namespace App\Http\Controllers;

use App\Models\Test;
use App\Models\TestQuestion;
use App\Services\GeminiService;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class TestController extends Controller
{
    public function index(Request $request)
    {
        $query = Test::withCount('questions')->with('sections')->latest();
        if ($request->user()->role === 'teacher') $query->where(function ($query) use ($request) { $query->where('teacher_id', $request->user()->id)->orWhereHas('sections.teachers', fn ($teacher) => $teacher->whereKey($request->user()->id)); });
        if ($request->user()->role === 'student') $query->where('status', 'published')->whereHas('sections.students', fn ($student) => $student->whereKey($request->user()->id));
        return response()->json($query->distinct()->get()->map(fn (Test $test) => $this->present($test, $request->user()->role !== 'student')));
    }

    public function show(Request $request, Test $test)
    {
        abort_unless($test->accessibleTo($request->user()), 403);
        return response()->json($this->present($test->load('questions'), $request->user()->role !== 'student'));
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $sections = $this->authorizedSections($request, $data['section_ids'] ?? []);
        $test = Test::create($this->testData($data, $request->user()->id));
        if (!empty($data['questions'])) $this->syncQuestions($test, $data['questions']);
        $test->sections()->sync($sections->modelKeys());
        return response()->json($this->present($test->load('questions'), true), 201);
    }

    public function update(Request $request, Test $test)
    {
        $this->authorizeOwner($request, $test);
        $data = $request->validate($this->rules(false));
        $sections = array_key_exists('section_ids', $data) ? $this->authorizedSections($request, $data['section_ids']) : null;
        DB::transaction(function () use ($test, $data) {
            $test->update($this->testData($data));
            if (array_key_exists('questions', $data)) $this->syncQuestions($test, $data['questions'] ?? []);
        });
        if ($sections) $test->sections()->sync($sections->modelKeys());
        return response()->json($this->present($test->fresh('questions'), true));
    }

    public function destroy(Request $request, Test $test)
    {
        $this->authorizeOwner($request, $test);
        $test->delete();
        return response()->noContent();
    }

    public function generate(Request $request, GeminiService $gemini)
    {
        $data = $request->validate([
            'material_text' => ['nullable', 'string', 'min:20', 'max:50000', 'required_without:material_file'],
            'material_file' => ['nullable', 'file', 'mimes:pdf,docx,txt', 'max:20480', 'required_without:material_text'],
            'question_count' => ['required', 'integer', 'in:10,15,20'],
            'difficulty' => ['nullable', 'in:Easy,Moderate,Hard'],
        ]);
        try {
            return response()->json(['questions' => $gemini->generateMcqs($data['material_text'] ?? '', $data['question_count'], $data['difficulty'] ?? 'Moderate', $request->file('material_file'))]);
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    public function publish(Request $request, Test $test)
    {
        $this->authorizeOwner($request, $test);
        abort_if($test->questions()->count() === 0, 422, 'A test needs at least one question before publishing.');
        abort_if($test->sections()->count() === 0, 422, 'Assign at least one section before publishing this test.');
        $test->update(['status' => 'published']);
        return response()->json($this->present($test->fresh('questions'), true));
    }

    public function updateQuestion(Request $request, TestQuestion $question)
    {
        $this->authorizeOwner($request, $question->test);
        $data = $request->validate([
            'question' => ['required', 'string', 'regex:/\S/'],
            'options' => ['required', 'array', 'size:4'],
            'options.A' => ['required', 'string', 'regex:/\S/'],
            'options.B' => ['required', 'string', 'regex:/\S/'],
            'options.C' => ['required', 'string', 'regex:/\S/'],
            'options.D' => ['required', 'string', 'regex:/\S/'],
            'correct_answer' => ['required', 'in:A,B,C,D'],
            'explanation' => ['required', 'string', 'regex:/\S/'],
            'position' => ['nullable', 'integer', 'min:0'],
            'answer_text' => ['prohibited'],
            'written_answer' => ['prohibited'],
        ]);
        $question->update($data);
        return response()->json($question->fresh());
    }

    public function deleteQuestion(Request $request, TestQuestion $question)
    {
        $this->authorizeOwner($request, $question->test);
        $question->delete();
        return response()->noContent();
    }

    private function rules(bool $required = true): array
    {
        return [
            'title' => [$required ? 'required' : 'sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'question_count' => ['nullable', 'integer', 'in:10,15,20'],
            'difficulty' => ['nullable', 'in:Easy,Moderate,Hard'],
            'time_limit' => ['nullable', 'integer', 'min:1'],
            'randomize_questions' => ['nullable', 'boolean'], 'randomize_options' => ['nullable', 'boolean'],
            'maximum_attempts' => ['nullable', 'integer', 'min:1'], 'show_result' => ['nullable', 'boolean'], 'show_explanations' => ['nullable', 'boolean'],
            'material_text' => ['nullable', 'string', 'max:50000'], 'questions' => ['sometimes', 'array'],
            'section_ids' => ['sometimes', 'array'], 'section_ids.*' => ['integer', 'distinct'],
            'questions.*.question' => ['required', 'string', 'regex:/\S/'], 'questions.*.options' => ['required', 'array', 'size:4'],
            'questions.*.options.A' => ['required', 'string', 'regex:/\S/'], 'questions.*.options.B' => ['required', 'string', 'regex:/\S/'], 'questions.*.options.C' => ['required', 'string', 'regex:/\S/'], 'questions.*.options.D' => ['required', 'string', 'regex:/\S/'],
            'questions.*.correct_answer' => ['required', 'in:A,B,C,D'], 'questions.*.explanation' => ['required', 'string', 'regex:/\S/'],
            'questions.*.answer_text' => ['prohibited'], 'questions.*.written_answer' => ['prohibited'],
        ];
    }

    private function testData(array $data, ?int $teacherId = null): array
    {
        return array_filter(['teacher_id' => $teacherId, 'title' => $data['title'] ?? null, 'description' => $data['description'] ?? null, 'question_count' => $data['question_count'] ?? 10, 'difficulty' => $data['difficulty'] ?? 'Moderate', 'time_limit' => $data['time_limit'] ?? null, 'randomize_questions' => $data['randomize_questions'] ?? false, 'randomize_options' => $data['randomize_options'] ?? false, 'maximum_attempts' => $data['maximum_attempts'] ?? 1, 'show_result' => $data['show_result'] ?? true, 'show_explanations' => $data['show_explanations'] ?? true, 'material_text' => $data['material_text'] ?? null], fn ($value) => $value !== null);
    }

    private function syncQuestions(Test $test, array $questions): void
    {
        $test->questions()->delete();
        foreach (array_values($questions) as $position => $question) {
            $test->questions()->create([
                'question' => $question['question'],
                'options' => $question['options'],
                'correct_answer' => $question['correct_answer'],
                'explanation' => $question['explanation'],
                'position' => $position,
            ]);
        }
    }

    private function authorizeOwner(Request $request, Test $test): void { abort_unless($test->accessibleTo($request->user()) && ($request->user()->role === 'admin' || $test->teacher_id === $request->user()->id), 403); }
    private function authorizedSections(Request $request, array $ids)
    {
        $sections = Section::whereIn('id', $ids)->get();
        abort_if($sections->count() !== count(array_unique($ids)), 422, 'One or more sections are invalid.');
        if ($request->user()->role !== 'admin') abort_unless($sections->every(fn (Section $section) => $section->isTaughtBy($request->user()->id)), 403);
        return $sections;
    }

    private function present(Test $test, bool $includeAnswers): array
    {
        return ['id' => $test->id, 'title' => $test->title, 'description' => $test->description, 'question_count' => $test->question_count, 'difficulty' => $test->difficulty, 'time_limit' => $test->time_limit, 'randomize_questions' => $test->randomize_questions, 'randomize_options' => $test->randomize_options, 'maximum_attempts' => $test->maximum_attempts, 'show_result' => $test->show_result, 'show_explanations' => $test->show_explanations, 'status' => $test->status, 'sections' => $test->relationLoaded('sections') ? $test->sections->map(fn ($section) => ['id' => $section->id, 'name' => $section->name, 'code' => $section->code])->values() : [], 'questions' => $test->relationLoaded('questions') ? $test->questions->map(fn ($q) => array_filter(['id' => $q->id, 'question' => $q->question, 'options' => $q->options, 'correct_answer' => $includeAnswers ? $q->correct_answer : null, 'explanation' => $includeAnswers ? $q->explanation : null, 'position' => $q->position], fn ($value) => $value !== null))->values() : []];
    }
}
