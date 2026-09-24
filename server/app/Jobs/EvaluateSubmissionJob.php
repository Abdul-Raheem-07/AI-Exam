<?php

namespace App\Jobs;

use App\Models\Submission;
use App\Services\GeminiService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class EvaluateSubmissionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(public int $submissionId) {}

    public function handle(GeminiService $gemini): void
    {
        $submission = Submission::with(['exam.questions'])->find($this->submissionId);
        if (!$submission || in_array($submission->status, ['completed', 'reviewed'], true)) return;
        try {
            $result = $gemini->evaluateHandwritten($submission->answer_file ?? [], $submission->exam->toArray());
            $submission->evaluation()->updateOrCreate([], ['score' => $result['score'], 'feedback' => json_encode($result['feedback']), 'ai_response' => $result, 'evaluated_at' => now()]);
            $submission->update(['status' => 'completed']);
        } catch (Throwable $exception) {
            $submission->update(['status' => 'failed']);
            Log::error('Handwritten evaluation failed', ['submission_id' => $submission->id, 'error' => $exception->getMessage()]);
            throw $exception;
        }
    }

    public function failed(Throwable $exception): void
    {
        Submission::whereKey($this->submissionId)->where('status', 'processing')->update(['status' => 'failed']);
        Log::error('Handwritten evaluation job exhausted retries', ['submission_id' => $this->submissionId, 'error' => $exception->getMessage()]);
    }
}
