<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    protected $fillable = ['name', 'code', 'program', 'semester', 'academic_year', 'created_by'];

    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function teachers() { return $this->belongsToMany(User::class, 'section_teachers', 'section_id', 'teacher_id')->withTimestamps(); }
    public function students() { return $this->belongsToMany(User::class, 'section_students', 'section_id', 'student_id')->withTimestamps(); }
    public function tests() { return $this->belongsToMany(Test::class, 'test_sections')->withTimestamps(); }

    public function isTaughtBy(int $userId): bool
    {
        return $this->teachers()->whereKey($userId)->exists();
    }
}
