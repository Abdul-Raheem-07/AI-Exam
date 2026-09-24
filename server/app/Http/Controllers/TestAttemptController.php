<?php

namespace App\Http\Controllers;

use App\Models\Test;
use App\Models\TestAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TestAttemptController extends Controller
{
    public function start(Request $request, Test $test)
    {
        abort_unless($test->accessibleTo($request->user()), 403);
        $used = TestAttempt::where('test_id', $test->id)->where('student_id', $request->user()->id)->where('status', 'submitted')->count();
        abort_if($used >= $test->maximum_attempts, 422, 'Maximum attempts reached.');
        $questions = $test->questions()->get();
        if ($test->randomize_questions) $questions = $questions->shuffle();
        return response()->json(['attempt' => TestAttempt::create(['test_id' => $test->id, 'student_id' => $request->user()->id, 'total_questions' => $questions->count(), 'started_at' => now()]), 'test' => ['id' => $test->id, 'title' => $test->title, 'time_limit' => $test->time_limit, 'randomize_options' => $test->randomize_options, 'questions' => $questions->map(function ($q) use ($test) {
            $options = $q->options;
            if ($test->randomize_options) { $values = collect($options)->shuffle()->values(); $options = ['A' => $values[0], 'B' => $values[1], 'C' => $values[2], 'D' => $values[3]]; }
            return ['id' => $q->id, 'question' => $q->question, 'options' => $options];
        })->values()]]);
    }

    public function submit(Request $request, TestAttempt $attempt)
    {
        abort_unless($attempt->student_id === $request->user()->id, 403);
        abort_unless($attempt->test->accessibleTo($request->user()), 403);
        if ($attempt->status === 'submitted') throw ValidationException::withMessages(['attempt' => 'This attempt has already been submitted.']);
        $data = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*.question_id' => ['required', 'integer'],
            'answers.*.answer' => ['nullable', 'in:A,B,C,D'],
            'answers.*.answer_text' => ['prohibited'],
            'answers.*.written_answer' => ['prohibited'],
            'time_taken' => ['nullable', 'integer', 'min:0'],
        ]);
        return DB::transaction(function () use ($attempt, $data) {
            $questions = $attempt->test->questions()->whereIn('id', collect($data['answers'])->pluck('question_id'))->get()->keyBy('id');
            $correct = 0;
            foreach ($data['answers'] as $answer) {
                $question = $questions->get($answer['question_id']);
                if (!$question) continue;
                $isCorrect = $question->correct_answer === ($answer['answer'] ?? null);
                $correct += $isCorrect ? 1 : 0;
                $attempt->answers()->create(['test_question_id' => $question->id, 'selected_answer' => $answer['answer'] ?? null, 'is_correct' => $isCorrect]);
            }
            $total = $attempt->test->questions()->count();
            $attempt->update(['total_questions' => $total, 'correct_answers' => $correct, 'incorrect_answers' => max(0, $total - $correct), 'score' => $correct, 'percentage' => $total ? round(($correct / $total) * 100, 2) : 0, 'time_taken' => $data['time_taken'] ?? null, 'status' => 'submitted', 'submitted_at' => now()]);
            return response()->json($this->formatResult($attempt->fresh(['test', 'answers.question'])));
        });
    }

    public function result(Request $request, TestAttempt $attempt)
    {
        abort_unless($attempt->student_id === $request->user()->id || $request->user()->role === 'admin' || ($request->user()->role === 'teacher' && $attempt->test->accessibleTo($request->user())), 403);
        abort_if($attempt->status !== 'submitted', 422, 'This attempt has not been submitted.');
        return response()->json($this->formatResult($attempt->load(['test', 'answers.question'])));
    }

    public function index(Request $request)
    {
        return response()->json(TestAttempt::with('test')->where('student_id', $request->user()->id)->where('status', 'submitted')->latest()->get()->map(fn ($attempt) => $this->formatResult($attempt)));
    }

    private function formatResult(TestAttempt $attempt): array
    {
        return ['id' => $attempt->id, 'test' => ['id' => $attempt->test->id, 'title' => $attempt->test->title], 'total_questions' => $attempt->total_questions, 'correct_answers' => $attempt->correct_answers, 'incorrect_answers' => $attempt->incorrect_answers, 'score' => $attempt->score, 'percentage' => $attempt->percentage, 'time_taken' => $attempt->time_taken, 'submitted_at' => $attempt->submitted_at, 'answers' => $attempt->relationLoaded('answers') ? $attempt->answers->map(fn ($answer) => ['question' => $answer->question->question, 'selected_answer' => $answer->selected_answer, 'correct_answer' => $answer->question->correct_answer, 'explanation' => $attempt->test->show_explanations ? $answer->question->explanation : null, 'is_correct' => $answer->is_correct])->values() : []];
    }
}
