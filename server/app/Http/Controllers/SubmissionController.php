<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Evaluation;
use App\Models\Exam;
use App\Models\Notification;
use App\Models\Submission;
use App\Jobs\EvaluateSubmissionJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SubmissionController extends Controller
{
    public function index(Request $request)
    {
        $query = Submission::with(['exam', 'student', 'evaluation'])->latest();
        if ($request->user()->role === 'student') $query->where('student_id', $request->user()->id);
        if ($request->user()->role === 'teacher') $query->whereHas('exam', fn ($q) => $q->where('teacher_id', $request->user()->id));
        return response()->json($query->get()->map(fn (Submission $submission) => $this->present($submission)));
    }

    public function store(Request $request, Exam $exam)
    {
        abort_unless($exam->status === 'active', 422, 'This exam is not active.');
        $data = $request->validate(['images' => ['required', 'array', 'min:1', 'max:10'], 'images.*' => ['file', 'mimes:jpg,jpeg,png,pdf', 'max:20480']]);
        $paths = array_map(fn ($file) => $file->store('submissions', 'local'), $data['images']);
        $submission = Submission::create(['exam_id' => $exam->id, 'student_id' => $request->user()->id, 'answer_file' => $paths, 'status' => 'pending', 'submitted_at' => now()]);
        return response()->json($this->present($submission->load(['exam', 'evaluation'])), 201);
    }

    public function show(Request $request, Submission $submission)
    {
        $this->authorizeSubmission($request, $submission);
        return response()->json($this->present($submission->load(['exam', 'student', 'evaluation'])));
    }

    public function evaluation(Request $request, Submission $submission)
    {
        $this->authorizeSubmission($request, $submission);
        return response()->json($submission->load('evaluation')->evaluation);
    }

    public function evaluate(Request $request, Submission $submission)
    {
        abort_unless($request->user()->role === 'admin' || $submission->exam->teacher_id === $request->user()->id, 403);
        if ($submission->status === 'completed' || $submission->status === 'processing') return response()->json(['message' => 'Submission is already evaluated or processing.'], 422);
        $submission->update(['status' => 'processing']);
        EvaluateSubmissionJob::dispatch($submission->id);
        return response()->json(['message' => 'Evaluation queued.'], 202);
    }

    public function override(Request $request, Submission $submission)
    {
        abort_unless($request->user()->role === 'admin' || $submission->exam->teacher_id === $request->user()->id, 403);
        $data = $request->validate(['newScore' => ['required', 'numeric', 'min:0'], 'justification' => ['required', 'string']]);
        $evaluation = $submission->evaluation ?: new Evaluation(['submission_id' => $submission->id]);
        $previous = $evaluation->score;
        $evaluation->fill(['score' => $data['newScore'], 'feedback' => $evaluation->feedback, 'evaluated_at' => now()])->save();
        $submission->update(['status' => 'completed']);
        AuditLog::create(['submission_id' => $submission->id, 'teacher_id' => $request->user()->id, 'previous_score' => $previous, 'new_score' => $data['newScore'], 'justification' => $data['justification']]);
        Notification::create(['user_id' => $submission->student_id, 'message' => 'Your exam score was manually updated.']);
        return response()->json(['message' => 'Marks overridden successfully.', 'submission' => $this->present($submission->fresh(['exam', 'evaluation']))]);
    }

    private function authorizeSubmission(Request $request, Submission $submission): void
    {
        $allowed = $request->user()->role === 'admin' || $submission->student_id === $request->user()->id || ($request->user()->role === 'teacher' && $submission->exam->teacher_id === $request->user()->id);
        abort_unless($allowed, 403);
    }

    private function present(Submission $submission): array
    {
        $evaluation = $submission->evaluation;
        return ['_id' => $submission->id, 'examId' => $submission->exam ? ['_id' => $submission->exam->id, 'title' => $submission->exam->title] : null, 'studentId' => $submission->student ? ['_id' => $submission->student->id, 'name' => $submission->student->name, 'email' => $submission->student->email] : null, 'status' => ucfirst($submission->status), 'totalMarks' => $evaluation?->score, 'feedback' => $evaluation?->feedback ? json_decode($evaluation->feedback, true) : [], 'confidence' => $evaluation?->ai_response['confidence'] ?? null, 'evaluatedByAI' => !empty($evaluation?->ai_response), 'updatedAt' => $submission->updated_at];
    }
}
