<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Test extends Model
{
    protected $fillable = [
        'teacher_id', 'title', 'description', 'question_count', 'difficulty',
        'time_limit', 'randomize_questions', 'randomize_options', 'maximum_attempts',
        'show_result', 'show_explanations', 'status', 'material_text', 'material_path',
    ];

    protected $casts = [
        'randomize_questions' => 'boolean',
        'randomize_options' => 'boolean',
        'show_result' => 'boolean',
        'show_explanations' => 'boolean',
    ];

    public function teacher() { return $this->belongsTo(User::class, 'teacher_id'); }
    public function questions() { return $this->hasMany(TestQuestion::class)->orderBy('position'); }
    public function attempts() { return $this->hasMany(TestAttempt::class); }
    public function sections() { return $this->belongsToMany(Section::class, 'test_sections')->withTimestamps(); }

    public function accessibleTo(User $user): bool
    {
        if ($user->role === 'admin' || $this->teacher_id === $user->id) return true;
        if ($user->role === 'student') {
            return $this->status === 'published' && $this->sections()->whereHas('students', fn ($query) => $query->whereKey($user->id))->exists();
        }
        return $this->sections()->whereHas('teachers', fn ($query) => $query->whereKey($user->id))->exists();
    }
}
