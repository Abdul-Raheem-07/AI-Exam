<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('test_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_id')->constrained()->cascadeOnDelete();
            $table->text('question');
            $table->json('options');
            $table->string('correct_answer', 1);
            $table->text('explanation');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->index(['test_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_questions');
    }
};
