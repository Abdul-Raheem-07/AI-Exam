<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Question;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function index(Exam $exam) { return response()->json($exam->questions); }

    public function store(Request $request, Exam $exam)
    {
        abort_unless($request->user()->role === 'admin' || $exam->teacher_id === $request->user()->id, 403);
        return response()->json($exam->questions()->create($request->validate(['question' => ['required', 'string'], 'expected_answer' => ['nullable', 'string'], 'marks' => ['required', 'integer', 'min:1']])), 201);
    }

    public function update(Request $request, Question $question)
    {
        abort_unless($request->user()->role === 'admin' || $question->exam->teacher_id === $request->user()->id, 403);
        $question->update($request->validate(['question' => ['sometimes', 'string'], 'expected_answer' => ['nullable', 'string'], 'marks' => ['sometimes', 'integer', 'min:1']]));
        return response()->json($question);
    }

    public function destroy(Request $request, Question $question)
    {
        abort_unless($request->user()->role === 'admin' || $question->exam->teacher_id === $request->user()->id, 403);
        $question->delete();
        return response()->noContent();
    }
}
