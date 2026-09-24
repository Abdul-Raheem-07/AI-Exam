<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\TestAttemptController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\SectionController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/health', fn () => response()->json(['status' => 'ok']));

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/exams', [ExamController::class, 'index']);
    Route::get('/exams/{exam}', [ExamController::class, 'show']);
    Route::get('/exams/{exam}/questions', [QuestionController::class, 'index']);

    Route::get('/tests', [TestController::class, 'index']);
    Route::get('/tests/{test}', [TestController::class, 'show']);

    Route::get('/student/sections', [SectionController::class, 'studentSections'])->middleware('role:student');

    Route::prefix('teacher')->middleware('role:teacher,admin')->group(function () {
        Route::get('/sections', [SectionController::class, 'index']);
        Route::get('/students', [SectionController::class, 'students']);
        Route::post('/sections', [SectionController::class, 'store']);
        Route::get('/sections/{section}', [SectionController::class, 'show']);
        Route::post('/sections/{section}/students', [SectionController::class, 'enroll']);
        Route::delete('/sections/{section}/students/{student}', [SectionController::class, 'removeStudent']);
        Route::post('/sections/{section}/teachers/{teacher}', [SectionController::class, 'addTeacher']);
        Route::apiResource('exams', ExamController::class)->except(['show']);
        Route::get('/exams/{exam}', [ExamController::class, 'show']);
        Route::get('/tests', [TestController::class, 'index']);
        Route::post('/tests', [TestController::class, 'store']);
        Route::post('/tests/generate', [TestController::class, 'generate']);
        Route::get('/tests/{test}', [TestController::class, 'show']);
        Route::put('/tests/{test}', [TestController::class, 'update']);
        Route::delete('/tests/{test}', [TestController::class, 'destroy']);
        Route::post('/tests/{test}/publish', [TestController::class, 'publish']);
        Route::put('/test-questions/{question}', [TestController::class, 'updateQuestion']);
        Route::delete('/test-questions/{question}', [TestController::class, 'deleteQuestion']);
    });

    Route::middleware('role:teacher,admin')->group(function () {
        Route::post('/exams/{exam}/questions', [QuestionController::class, 'store']);
        Route::put('/questions/{question}', [QuestionController::class, 'update']);
        Route::delete('/questions/{question}', [QuestionController::class, 'destroy']);
        Route::get('/submissions', [SubmissionController::class, 'index']);
        Route::get('/submissions/{submission}', [SubmissionController::class, 'show']);
        Route::get('/submissions/{submission}/status', [SubmissionController::class, 'show']);
        Route::get('/submissions/{submission}/evaluation', [SubmissionController::class, 'evaluation']);
        Route::post('/submissions/{submission}/evaluate', [SubmissionController::class, 'evaluate']);
        Route::put('/submissions/{submission}/override', [SubmissionController::class, 'override']);
    });

    Route::middleware('role:student')->group(function () {
        Route::get('/student/exams', [ExamController::class, 'index']);
        Route::get('/student/exams/{exam}', [ExamController::class, 'show']);
        Route::post('/student/exams/{exam}/submit', [SubmissionController::class, 'store']);
        Route::get('/student/results', [SubmissionController::class, 'index']);
        Route::get('/student/tests', [TestController::class, 'index']);
        Route::get('/student/tests/{test}', [TestController::class, 'show']);
        Route::post('/student/tests/{test}/start', [TestAttemptController::class, 'start']);
        Route::post('/student/attempts/{attempt}/submit', [TestAttemptController::class, 'submit']);
        Route::get('/student/test-results', [TestAttemptController::class, 'index']);
        Route::post('/submissions', function (\Illuminate\Http\Request $request) {
            return app(SubmissionController::class)->store($request, \App\Models\Exam::findOrFail($request->input('examId')));
        });
        Route::get('/submissions/{submission}', [SubmissionController::class, 'show']);
        Route::get('/submissions/{submission}/status', [SubmissionController::class, 'show']);
        Route::get('/submissions/{submission}/evaluation', [SubmissionController::class, 'evaluation']);
    });

    Route::get('/student/attempts/{attempt}', [TestAttemptController::class, 'result']);

    Route::get('/admin/dashboard', [AdminController::class, 'dashboard'])->middleware('role:admin');
});
