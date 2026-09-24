<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    protected $fillable = ['teacher_id', 'title', 'description', 'rubric', 'duration', 'status'];
    public function teacher() { return $this->belongsTo(User::class, 'teacher_id'); }
    public function questions() { return $this->hasMany(Question::class); }
    public function submissions() { return $this->hasMany(Submission::class); }
}
