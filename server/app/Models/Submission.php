<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    protected $fillable = ['exam_id', 'student_id', 'answer_file', 'status', 'submitted_at'];
    protected $casts = ['submitted_at' => 'datetime', 'answer_file' => 'array'];
    public function exam() { return $this->belongsTo(Exam::class); }
    public function student() { return $this->belongsTo(User::class, 'student_id'); }
    public function evaluation() { return $this->hasOne(Evaluation::class); }
}
