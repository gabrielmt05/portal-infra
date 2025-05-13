<?php
namespace Src\Controllers;

use Src\Models\User;
use Src\Utilities\Session;
use Src\Utilities\Validator;

/**
 * Authentication Controller
 * 
 * Handles user authentication functionality
 */
class AuthController
{
    /**
     * Show login form
     * 
     * @return void
     */
    public function showLogin()
    {
        // If already logged in, redirect to dashboard
        if (Session::get('user_id')) {
            header('Location: /dashboard');
            exit;
        }
        
        // Include login view
        include VIEW_PATH . '/auth/login.php';
    }
    
    /**
     * Handle login attempt
     * 
     * @return void
     */
    public function login()
    {
        // If already logged in, redirect to dashboard
        if (Session::get('user_id')) {
            header('Location: /dashboard');
            exit;
        }
        
        // Validate login credentials
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        
        // Basic validation
        $errors = [];
        
        if (empty($username)) {
            $errors[] = 'Username is required';
        }
        
        if (empty($password)) {
            $errors[] = 'Password is required';
        }
        
        // If there are validation errors, show the login form again
        if (!empty($errors)) {
            Session::set('errors', $errors);
            header('Location: /');
            exit;
        }
        
        // Attempt to authenticate user
        $userModel = new User();
        $user = $userModel->getByUsername($username);
        
        if (!$user || !password_verify($password, $user['password'])) {
            Session::set('errors', ['Invalid username or password']);
            header('Location: /');
            exit;
        }
        
        // Set session data
        Session::set('user_id', $user['id']);
        Session::set('username', $user['username']);
        Session::set('full_name', $user['full_name']);
        Session::set('is_admin', $user['is_admin']);
        
        // Redirect to dashboard
        header('Location: /dashboard');
        exit;
    }
    
    /**
     * Handle user logout
     * 
     * @return void
     */
    public function logout()
    {
        // Clear all session data
        Session::clear();
        
        // Redirect to login page
        header('Location: /');
        exit;
    }
}
