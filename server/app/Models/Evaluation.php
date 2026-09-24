<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    protected $fillable = ['submission_id', 'score', 'feedback', 'ai_response', 'evaluated_at'];
    protected $casts = ['ai_response' => 'array', 'evaluated_at' => 'datetime'];
    public function submission() { return $this->belongsTo(Submission::class); }
}
