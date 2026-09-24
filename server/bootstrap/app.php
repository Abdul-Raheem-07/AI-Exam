<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Access\AuthorizationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias(['role' => \App\Http\Middleware\RoleMiddleware::class]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());
        $exceptions->render(function (Throwable $exception, Request $request) {
            if (!$request->is('api/*') && !$request->expectsJson()) return null;
            if ($exception instanceof ValidationException) return response()->json(['message' => 'Validation failed.', 'errors' => $exception->errors()], 422);
            if ($exception instanceof AuthenticationException) return response()->json(['message' => 'Unauthenticated.'], 401);
            if ($exception instanceof AuthorizationException) return response()->json(['message' => 'Forbidden.'], 403);
            $status = $exception instanceof HttpExceptionInterface ? $exception->getStatusCode() : 500;
            $message = $status >= 500 ? 'An unexpected server error occurred.' : $exception->getMessage();
            return response()->json(['message' => $message ?: 'Request failed.'], $status);
        });
    })->create();
