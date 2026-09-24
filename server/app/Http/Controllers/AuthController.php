<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:255'], 'email' => ['required', 'email', 'unique:users,email'], 'password' => ['required', 'string', 'min:8', 'confirmed'], 'role' => ['nullable', 'in:student,teacher,Student,Teacher']]);
        $user = User::create(['name' => $data['name'], 'email' => $data['email'], 'password' => Hash::make($data['password']), 'role' => strtolower($data['role'] ?? 'student')]);
        return response()->json($this->payload($user), 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        $user = User::where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password)) throw ValidationException::withMessages(['email' => ['Invalid email or password.']]);
        return response()->json($this->payload($user));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function user(Request $request) { return response()->json($this->payload($request->user(), false)); }

    private function payload(User $user, bool $withToken = true): array
    {
        return ['_id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => ucfirst($user->role)] + ($withToken ? ['token' => $user->createToken('react')->plainTextToken] : []);
    }
}
