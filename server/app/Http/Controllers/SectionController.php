<?php

namespace App\Http\Controllers;

use App\Models\Section;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SectionController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->role === 'admin' ? Section::query() : $request->user()->teachingSections();
        return response()->json($query->withCount(['students', 'tests'])->with('teachers')->get()->map(fn (Section $section) => $this->present($section)));
    }

    public function studentSections(Request $request)
    {
        return response()->json($request->user()->studentSections()->withCount(['students', 'tests'])->with('teachers')->get()->map(fn (Section $section) => $this->present($section)));
    }

    public function students(Request $request)
    {
        $query = User::where('role', 'student')->orderBy('name');
        if ($request->filled('search')) $query->where(fn ($q) => $q->where('name', 'like', '%' . $request->string('search') . '%')->orWhere('email', 'like', '%' . $request->string('search') . '%'));
        return response()->json($query->limit(50)->get(['id', 'name', 'email']));
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:255'], 'code' => ['required', 'string', 'max:50', 'unique:sections,code'], 'program' => ['nullable', 'string', 'max:255'], 'semester' => ['nullable', 'integer', 'min:1'], 'academic_year' => ['nullable', 'string', 'max:20']]);
        $section = Section::create([...$data, 'created_by' => $request->user()->id]);
        $section->teachers()->attach($request->user()->id);
        return response()->json($this->present($section->load('teachers')), 201);
    }

    public function show(Request $request, Section $section)
    {
        $this->authorizeTeacher($request, $section);
        return response()->json($this->present($section->load(['students', 'teachers'])->loadCount(['students', 'tests'])) + ['students' => $section->students->map(fn (User $student) => ['id' => $student->id, 'name' => $student->name, 'email' => $student->email])->values()]);
    }

    public function enroll(Request $request, Section $section)
    {
        $this->authorizeTeacher($request, $section);
        $data = $request->validate(['student_id' => ['required', 'integer', Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'student'))]]);
        $section->students()->syncWithoutDetaching([$data['student_id']]);
        return response()->json($this->present($section->fresh()->loadCount(['students', 'tests'])));
    }

    public function removeStudent(Request $request, Section $section, User $student)
    {
        $this->authorizeTeacher($request, $section);
        abort_unless($student->role === 'student', 422);
        $section->students()->detach($student->id);
        return response()->noContent();
    }

    public function addTeacher(Request $request, Section $section, User $teacher)
    {
        $this->authorizeTeacher($request, $section);
        abort_unless($teacher->role === 'teacher', 422);
        $section->teachers()->syncWithoutDetaching([$teacher->id]);
        return response()->json($this->present($section->fresh()->load('teachers')));
    }

    private function authorizeTeacher(Request $request, Section $section): void
    {
        abort_unless($request->user()->role === 'admin' || $section->isTaughtBy($request->user()->id), 403);
    }

    private function present(Section $section): array
    {
        return ['id' => $section->id, 'name' => $section->name, 'code' => $section->code, 'program' => $section->program, 'semester' => $section->semester, 'academic_year' => $section->academic_year, 'student_count' => $section->students_count ?? null, 'test_count' => $section->tests_count ?? null, 'teachers' => $section->relationLoaded('teachers') ? $section->teachers->map(fn (User $teacher) => ['id' => $teacher->id, 'name' => $teacher->name])->values() : []];
    }
}
