<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function dashboard()
    {
        $total = Submission::count();
        $evaluated = Submission::where('status', 'completed')->count();
        $scores = Submission::where('status', 'completed')->with('evaluation')->get()->pluck('evaluation.score')->filter();
        return response()->json(['metrics' => ['totalUsers' => User::count(), 'totalStudents' => User::where('role', 'student')->count(), 'totalTeachers' => User::where('role', 'teacher')->count(), 'totalExams' => Exam::count(), 'activeExams' => Exam::where('status', 'active')->count(), 'totalSubmissions' => $total, 'evaluatedSubmissions' => $evaluated, 'averageScore' => $scores->count() ? round($scores->average(), 2) : 0, 'aiSuccessRate' => $total ? round(($evaluated / $total) * 100, 1) : 0]]);
    }
}
