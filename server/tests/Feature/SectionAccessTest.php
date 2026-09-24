<?php

namespace Tests\Feature;

use App\Models\Section;
use App\Models\Test as AssessmentTest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SectionAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_students_only_see_tests_assigned_to_their_sections(): void
    {
        [$teacher, $sectionA, $sectionB] = $this->sectionSetup();
        $studentA = User::factory()->create(['role' => 'student']);
        $studentB = User::factory()->create(['role' => 'student']);
        $studentC = User::factory()->create(['role' => 'student']);
        $sectionA->students()->attach($studentA);
        $sectionB->students()->attach($studentB);

        $test = $this->test($teacher, 'Section A test', [$sectionA]);
        $both = $this->test($teacher, 'Both sections test', [$sectionA, $sectionB]);

        $this->actingAs($studentA)->getJson('/api/student/tests')->assertOk()->assertJsonCount(2);
        $this->actingAs($studentB)->getJson('/api/student/tests')->assertOk()->assertJsonCount(1)->assertJsonPath('0.title', 'Both sections test');
        $this->actingAs($studentC)->getJson('/api/student/tests')->assertOk()->assertJsonCount(0);
        $this->actingAs($studentB)->getJson("/api/student/tests/{$test->id}")->assertForbidden();
        $this->actingAs($studentB)->postJson("/api/student/tests/{$test->id}/start")->assertForbidden();
    }

    public function test_teacher_cannot_assign_or_manage_another_teachers_section(): void
    {
        $teacherA = User::factory()->create(['role' => 'teacher']);
        $teacherB = User::factory()->create(['role' => 'teacher']);
        $sectionA = Section::create(['name' => 'A', 'code' => 'SEC-A', 'created_by' => $teacherA->id]);
        $sectionA->teachers()->attach($teacherA);
        $sectionB = Section::create(['name' => 'B', 'code' => 'SEC-B', 'created_by' => $teacherB->id]);
        $sectionB->teachers()->attach($teacherB);

        $this->actingAs($teacherA)->postJson('/api/teacher/tests', [
            'title' => 'Unauthorized assignment', 'question_count' => 10, 'section_ids' => [$sectionB->id],
        ])->assertForbidden();
        $this->actingAs($teacherB)->getJson("/api/teacher/sections/{$sectionA->id}")->assertForbidden();
        $this->actingAs($teacherB)->postJson("/api/teacher/sections/{$sectionA->id}/students", ['student_id' => User::factory()->create(['role' => 'student'])->id])->assertForbidden();
    }

    public function test_teacher_can_enroll_student_and_multiple_teachers_can_access_section_work(): void
    {
        $teacherA = User::factory()->create(['role' => 'teacher']);
        $teacherB = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $section = Section::create(['name' => 'Shared', 'code' => 'SEC-SHARED', 'created_by' => $teacherA->id]);
        $section->teachers()->attach($teacherA);
        $this->actingAs($teacherA)->postJson("/api/teacher/sections/{$section->id}/teachers/{$teacherB->id}")->assertOk();
        $this->actingAs($teacherB)->postJson("/api/teacher/sections/{$section->id}/students", ['student_id' => $student->id])->assertOk();

        $test = $this->test($teacherA, 'Shared test', [$section]);
        $this->actingAs($teacherB)->getJson('/api/teacher/tests')->assertOk()->assertJsonPath('0.title', 'Shared test');
        $this->actingAs($student)->getJson('/api/student/tests')->assertOk()->assertJsonPath('0.title', 'Shared test');
        $attempt = $this->actingAs($student)->postJson("/api/student/tests/{$test->id}/start")->assertOk()->json('attempt.id');
        $this->actingAs($student)->postJson("/api/student/attempts/{$attempt}/submit", ['answers' => [['question_id' => $test->questions()->first()->id, 'answer' => 'A']], 'time_taken' => 1])->assertOk();
        $this->actingAs($teacherB)->getJson("/api/student/attempts/{$attempt}")->assertOk();
        $this->assertDatabaseHas('test_sections', ['test_id' => $test->id, 'section_id' => $section->id]);
    }

    private function sectionSetup(): array
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $sectionA = Section::create(['name' => 'A', 'code' => 'SEC-A', 'created_by' => $teacher->id]);
        $sectionB = Section::create(['name' => 'B', 'code' => 'SEC-B', 'created_by' => $teacher->id]);
        $sectionA->teachers()->attach($teacher);
        $sectionB->teachers()->attach($teacher);
        return [$teacher, $sectionA, $sectionB];
    }

    private function test(User $teacher, string $title, array $sections): AssessmentTest
    {
        $test = AssessmentTest::create(['teacher_id' => $teacher->id, 'title' => $title, 'question_count' => 1, 'status' => 'published']);
        $test->sections()->attach(collect($sections)->pluck('id'));
        $test->questions()->create(['question' => 'Question', 'options' => ['A' => 'A', 'B' => 'B', 'C' => 'C', 'D' => 'D'], 'correct_answer' => 'A', 'explanation' => 'Explanation', 'position' => 0]);
        return $test;
    }
}
