<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $query = Exam::with('questions')->latest();
        if ($request->user()->role === 'teacher') $query->where('teacher_id', $request->user()->id);
        if ($request->user()->role === 'student') $query->where('status', 'active');
        return response()->json($query->get()->map(fn (Exam $exam) => $this->present($exam)));
    }

    public function store(Request $request)
    {
        $data = $request->validate(['title' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string'], 'rubric' => ['nullable', 'string'], 'duration' => ['nullable', 'integer', 'min:1'], 'status' => ['nullable', 'in:draft,active,closed'], 'questions' => ['required', 'array', 'min:1'], 'questions.*.questionText' => ['required', 'string'], 'questions.*.maxMarks' => ['required', 'integer', 'min:1']]);
        $exam = Exam::create(['teacher_id' => $request->user()->id, 'title' => $data['title'], 'description' => $data['description'] ?? null, 'rubric' => $data['rubric'] ?? null, 'duration' => $data['duration'] ?? null, 'status' => $data['status'] ?? 'active']);
        $exam->questions()->createMany(array_map(fn ($question) => ['question' => $question['questionText'], 'expected_answer' => $question['expected_answer'] ?? null, 'marks' => $question['maxMarks']], $data['questions']));
        return response()->json($this->present($exam->load('questions')), 201);
    }

    public function show(Request $request, Exam $exam)
    {
        abort_unless($request->user()->role === 'admin' || $exam->status === 'active' || $exam->teacher_id === $request->user()->id, 403);
        return response()->json($this->present($exam->load('questions')));
    }

    public function update(Request $request, Exam $exam)
    {
        abort_unless($request->user()->role === 'admin' || $exam->teacher_id === $request->user()->id, 403);
        $exam->update($request->validate(['title' => ['sometimes', 'string', 'max:255'], 'description' => ['nullable', 'string'], 'rubric' => ['nullable', 'string'], 'duration' => ['nullable', 'integer', 'min:1'], 'status' => ['sometimes', 'in:draft,active,closed']]));
        return response()->json($this->present($exam->load('questions')));
    }

    public function destroy(Request $request, Exam $exam)
    {
        abort_unless($request->user()->role === 'admin' || $exam->teacher_id === $request->user()->id, 403);
        $exam->delete();
        return response()->noContent();
    }

    public function present(Exam $exam): array
    {
        return ['_id' => $exam->id, 'title' => $exam->title, 'description' => $exam->description, 'rubric' => $exam->rubric, 'status' => ucfirst($exam->status), 'questions' => $exam->questions->map(fn ($question) => ['_id' => $question->id, 'questionText' => $question->question, 'maxMarks' => $question->marks])->values()];
    }
}
