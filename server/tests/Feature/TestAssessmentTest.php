<?php

namespace Tests\Feature;

use App\Models\Test as AssessmentTest;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TestAssessmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_submit_an_attempt_once_and_receives_learning_feedback(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $section = Section::create(['name' => 'Physics A', 'code' => 'PHY-A', 'created_by' => $teacher->id]);
        $section->teachers()->attach($teacher);
        $section->students()->attach($student);
        $test = AssessmentTest::create(['teacher_id' => $teacher->id, 'title' => 'Physics', 'question_count' => 1, 'status' => 'published']);
        $test->sections()->attach($section);
        $question = $test->questions()->create(['question' => 'What is velocity?', 'options' => ['A' => 'Speed with direction', 'B' => 'Mass', 'C' => 'Force', 'D' => 'Energy'], 'correct_answer' => 'A', 'explanation' => 'Velocity includes direction.', 'position' => 0]);
        $attempt = $this->actingAs($student)->postJson("/api/student/tests/{$test->id}/start")->assertOk()->json('attempt.id');

        $response = $this->actingAs($student)->postJson("/api/student/attempts/{$attempt}/submit", ['answers' => [['question_id' => $question->id, 'answer' => 'A']], 'time_taken' => 12]);
        $response->assertOk()->assertJsonPath('correct_answers', 1)->assertJsonPath('incorrect_answers', 0)->assertJsonPath('percentage', '100.00');
        $response->assertJsonPath('answers.0.explanation', 'Velocity includes direction.');
        $this->actingAs($student)->postJson("/api/student/attempts/{$attempt}/submit", ['answers' => []])->assertStatus(422);
    }

    public function test_submission_rejects_written_answer_fields(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $section = \App\Models\Section::create(['name' => 'MCQ Only', 'code' => 'MCQ-ONLY', 'created_by' => $teacher->id]);
        $section->teachers()->attach($teacher);
        $section->students()->attach($student);
        $test = AssessmentTest::create(['teacher_id' => $teacher->id, 'title' => 'MCQ Only', 'question_count' => 1, 'status' => 'published']);
        $test->sections()->attach($section);
        $question = $test->questions()->create(['question' => 'Q', 'options' => ['A' => 'A', 'B' => 'B', 'C' => 'C', 'D' => 'D'], 'correct_answer' => 'A', 'explanation' => 'Because A.', 'position' => 0]);
        $attempt = $this->actingAs($student)->postJson("/api/student/tests/{$test->id}/start")->json('attempt.id');
        $this->actingAs($student)->postJson("/api/student/attempts/{$attempt}/submit", ['answers' => [['question_id' => $question->id, 'answer' => 'A', 'answer_text' => 'A']]])->assertStatus(422);
        $this->actingAs($student)->postJson("/api/student/attempts/{$attempt}/submit", ['answers' => [['question_id' => $question->id, 'written_answer' => 'some written answer']]])->assertStatus(422);
    }

    public function test_teacher_cannot_save_invalid_or_written_mcq_payloads(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $section = Section::create(['name' => 'MCQ Contract', 'code' => 'MCQ-C', 'created_by' => $teacher->id]);
        $section->teachers()->attach($teacher);
        $valid = [
            'title' => 'Networking',
            'question_count' => 10,
            'section_ids' => [$section->id],
            'questions' => [[
                'question' => 'Which protocol is used for secure HTTP communication?',
                'options' => ['A' => 'HTTP', 'B' => 'FTP', 'C' => 'HTTPS', 'D' => 'SMTP'],
                'correct_answer' => 'C',
                'explanation' => 'HTTPS encrypts HTTP traffic.',
            ]],
        ];

        $this->actingAs($teacher)->postJson('/api/teacher/tests', $valid)->assertCreated();
        $this->actingAs($teacher)->postJson('/api/teacher/tests', array_replace_recursive($valid, ['questions' => [['answer_text' => 'some written answer']]]))->assertStatus(422);
        $threeOptions = $valid;
        $threeOptions['questions'][0]['options'] = ['A' => 'HTTP', 'B' => 'FTP', 'C' => 'HTTPS'];
        $this->actingAs($teacher)->postJson('/api/teacher/tests', $threeOptions)->assertStatus(422);
        $this->actingAs($teacher)->postJson('/api/teacher/tests', array_replace_recursive($valid, ['questions' => [['options' => ['A' => 'HTTP', 'B' => ' ', 'C' => 'HTTPS', 'D' => 'SMTP']]]]))->assertStatus(422);
        $this->actingAs($teacher)->postJson('/api/teacher/tests', array_replace_recursive($valid, ['questions' => [['correct_answer' => 'E']]]))->assertStatus(422);
        $this->actingAs($teacher)->postJson('/api/teacher/tests', array_replace_recursive($valid, ['questions' => [['question' => '   ']]]))->assertStatus(422);
    }

    public function test_student_cannot_read_another_students_attempt(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $otherStudent = User::factory()->create(['role' => 'student']);
        $section = Section::create(['name' => 'Biology A', 'code' => 'BIO-A', 'created_by' => $teacher->id]);
        $section->teachers()->attach($teacher);
        $section->students()->attach($student);
        $test = AssessmentTest::create(['teacher_id' => $teacher->id, 'title' => 'Biology', 'question_count' => 1, 'status' => 'published']);
        $test->sections()->attach($section);
        $test->questions()->create(['question' => 'Q', 'options' => ['A' => 'A', 'B' => 'B', 'C' => 'C', 'D' => 'D'], 'correct_answer' => 'A', 'explanation' => 'Because A.', 'position' => 0]);
        $attempt = $this->actingAs($student)->postJson("/api/student/tests/{$test->id}/start")->json('attempt.id');
        $this->actingAs($otherStudent)->getJson("/api/student/attempts/{$attempt}")->assertForbidden();
    }
}
