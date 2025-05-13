<?php
namespace Src\Middleware;

use Src\Utilities\Session;

/**
 * Authentication Middleware
 * 
 * Provides authentication and authorization checks
 */
class AuthMiddleware
{
    /**
     * Authenticate user - redirect to login if not authenticated
     * 
     * @return void
     */
    public static function authenticate()
    {
        if (!Session::get('user_id')) {
            header('Location: /');
            exit;
        }
    }
    
    /**
     * Check if user is admin - redirect if not
     * 
     * @return void
     */
    public static function requireAdmin()
    {
        self::authenticate();
        
        if (!Session::get('is_admin')) {
            Session::set('errors', ['Access denied. Administrator privileges required.']);
            header('Location: /dashboard');
            exit;
        }
    }
}
