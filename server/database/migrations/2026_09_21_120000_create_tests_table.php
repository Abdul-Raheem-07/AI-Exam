<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('question_count')->default(10);
            $table->string('difficulty')->default('Moderate');
            $table->unsignedInteger('time_limit')->nullable();
            $table->boolean('randomize_questions')->default(false);
            $table->boolean('randomize_options')->default(false);
            $table->unsignedInteger('maximum_attempts')->default(1);
            $table->boolean('show_result')->default(true);
            $table->boolean('show_explanations')->default(true);
            $table->enum('status', ['draft', 'published'])->default('draft')->index();
            $table->longText('material_text')->nullable();
            $table->string('material_path')->nullable();
            $table->timestamps();
            $table->index(['teacher_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tests');
    }
};
