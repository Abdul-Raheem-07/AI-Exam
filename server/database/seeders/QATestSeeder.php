<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Section;
use App\Models\Test;
use App\Models\TestQuestion;

class QATestSeeder extends Seeder
{
    public function run(): void
    {
        $teacher1 = User::where('email', 'teacher1@test.local')->first();
        $teacher2 = User::where('email', 'teacher2@test.local')->first();
        
        $sectionA = Section::where('code', 'SE-A')->first();
        $sectionB = Section::where('code', 'SE-B')->first();
        $sectionC = Section::where('code', 'SE-C')->first();

        // 1. Draft Test
        $draftTest = Test::create([
            'teacher_id' => $teacher1->id,
            'title' => 'Software Design Patterns (Draft)',
            'description' => 'A draft exam that should not be visible to students.',
            'question_count' => 2,
            'status' => 'draft',
        ]);
        $this->seedQuestions($draftTest);

        // 2. Published Test for Section A
        $testA = Test::create([
            'teacher_id' => $teacher1->id,
            'title' => 'Advanced Algorithms - Exam A',
            'description' => 'An MCQ exam assigned specifically to Section A.',
            'question_count' => 2,
            'status' => 'published',
        ]);
        $this->seedQuestions($testA);
        $testA->sections()->syncWithoutDetaching([$sectionA->id]);

        // 3. Published Test for Section B
        $testB = Test::create([
            'teacher_id' => $teacher2->id,
            'title' => 'Data Structures - Exam B',
            'description' => 'An MCQ exam assigned specifically to Section B.',
            'question_count' => 2,
            'status' => 'published',
        ]);
        $this->seedQuestions($testB);
        $testB->sections()->syncWithoutDetaching([$sectionB->id]);

        // 4. Shared Test assigned to multiple sections (A and B)
        $sharedTest = Test::create([
            'teacher_id' => $teacher1->id,
            'title' => 'Midterm Assessment - Core Concepts',
            'description' => 'A comprehensive test shared across multiple sections.',
            'question_count' => 2,
            'status' => 'published',
        ]);
        $this->seedQuestions($sharedTest);
        $sharedTest->sections()->syncWithoutDetaching([$sectionA->id, $sectionB->id]);
    }

    private function seedQuestions(Test $test)
    {
        TestQuestion::create([
            'test_id' => $test->id,
            'position' => 1,
            'question' => 'What is the time complexity of binary search?',
            'options' => [
                'A' => 'O(n)',
                'B' => 'O(log n)',
                'C' => 'O(n^2)',
                'D' => 'O(1)',
            ],
            'correct_answer' => 'B',
            'explanation' => 'Binary search halves the search space at each step, leading to logarithmic time complexity.'
        ]);

        TestQuestion::create([
            'test_id' => $test->id,
            'position' => 2,
            'question' => 'Which of these is NOT a solid design principle?',
            'options' => [
                'A' => 'Single Responsibility',
                'B' => 'Open-Closed',
                'C' => 'Dependency Inversion',
                'D' => 'Polymorphism',
            ],
            'correct_answer' => 'D',
            'explanation' => 'Polymorphism is an OOP concept, while SOLID principles refer to SRP, OCP, LSP, ISP, and DIP.'
        ]);
    }
}
