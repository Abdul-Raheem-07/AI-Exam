<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Section;
use Illuminate\Support\Facades\Hash;

class QADemoSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('Test@12345');

        // Create Teachers
        $teachers = [];
        $teacherNames = ['Teacher One', 'Teacher Two', 'Teacher Three'];
        for ($i = 1; $i <= 3; $i++) {
            $teachers[$i] = User::firstOrCreate(
                ['email' => "teacher{$i}@test.local"],
                ['name' => $teacherNames[$i-1], 'role' => 'teacher', 'password' => $password]
            );
        }

        // Create Students
        $students = [];
        $studentNames = [
            'Student One', 'Student Two', 'Student Three', 'Student Four',
            'Student Five', 'Student Six', 'Student Seven', 'Student Eight',
            'Student Nine', 'Student Ten', 'Student Eleven', 'Student Twelve'
        ];
        for ($i = 1; $i <= 12; $i++) {
            $students[$i] = User::firstOrCreate(
                ['email' => "student{$i}@test.local"],
                ['name' => $studentNames[$i-1], 'role' => 'student', 'password' => $password]
            );
        }

        // Create Sections
        $sectionA = Section::firstOrCreate(
            ['code' => 'SE-A'],
            ['name' => 'Software Engineering — Section A', 'program' => 'BSSE', 'created_by' => $teachers[1]->id]
        );
        $sectionB = Section::firstOrCreate(
            ['code' => 'SE-B'],
            ['name' => 'Software Engineering — Section B', 'program' => 'BSSE', 'created_by' => $teachers[2]->id]
        );
        $sectionC = Section::firstOrCreate(
            ['code' => 'SE-C'],
            ['name' => 'Software Engineering — Section C', 'program' => 'BSSE', 'created_by' => $teachers[1]->id]
        );

        // Assign Teachers
        $sectionA->teachers()->syncWithoutDetaching([$teachers[1]->id, $teachers[2]->id]);
        $sectionB->teachers()->syncWithoutDetaching([$teachers[2]->id, $teachers[3]->id]);
        $sectionC->teachers()->syncWithoutDetaching([$teachers[1]->id, $teachers[3]->id]);

        // Enroll Students
        $sectionA->students()->syncWithoutDetaching(
            collect(range(1, 5))->map(fn($i) => $students[$i]->id)->toArray()
        );
        $sectionB->students()->syncWithoutDetaching(
            collect(range(4, 9))->map(fn($i) => $students[$i]->id)->toArray()
        );
        $sectionC->students()->syncWithoutDetaching(
            collect([2, 3, 7, 8, 10, 11, 12])->map(fn($i) => $students[$i]->id)->toArray()
        );
    }
}
