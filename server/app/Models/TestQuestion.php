<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestQuestion extends Model
{
    protected $fillable = ['test_id', 'question', 'options', 'correct_answer', 'explanation', 'position'];
    protected $casts = ['options' => 'array'];
    public function test() { return $this->belongsTo(Test::class); }
    public function answers() { return $this->hasMany(TestAnswer::class); }
}
