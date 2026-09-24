<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestAttempt extends Model
{
    protected $fillable = [
        'test_id', 'student_id', 'total_questions', 'correct_answers', 'incorrect_answers',
        'score', 'percentage', 'time_taken', 'status', 'started_at', 'submitted_at',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'percentage' => 'decimal:2',
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function test() { return $this->belongsTo(Test::class); }
    public function student() { return $this->belongsTo(User::class, 'student_id'); }
    public function answers() { return $this->hasMany(TestAnswer::class); }
}
