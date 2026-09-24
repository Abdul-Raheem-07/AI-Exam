<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = ['submission_id', 'teacher_id', 'previous_score', 'new_score', 'justification'];
}
