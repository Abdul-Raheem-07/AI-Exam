<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestAnswer extends Model
{
    protected $fillable = ['test_attempt_id', 'test_question_id', 'selected_answer', 'is_correct'];
    protected $casts = ['is_correct' => 'boolean'];
    public function attempt() { return $this->belongsTo(TestAttempt::class, 'test_attempt_id'); }
    public function question() { return $this->belongsTo(TestQuestion::class, 'test_question_id'); }
}
