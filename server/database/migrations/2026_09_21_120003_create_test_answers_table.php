<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('test_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_attempt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('test_question_id')->constrained()->cascadeOnDelete();
            $table->string('selected_answer', 1)->nullable();
            $table->boolean('is_correct')->default(false);
            $table->timestamps();
            $table->unique(['test_attempt_id', 'test_question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_answers');
    }
};
