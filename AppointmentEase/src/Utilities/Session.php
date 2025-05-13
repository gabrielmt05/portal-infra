<?php
namespace Src\Utilities;

/**
 * Session Utility
 * 
 * Provides methods for session management
 */
class Session
{
    /**
     * Get a value from the session
     * 
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function get($key, $default = null)
    {
        return $_SESSION[$key] ?? $default;
    }
    
    /**
     * Set a value in the session
     * 
     * @param string $key
     * @param mixed $value
     * @return void
     */
    public static function set($key, $value)
    {
        $_SESSION[$key] = $value;
    }
    
    /**
     * Check if a key exists in the session
     * 
     * @param string $key
     * @return bool
     */
    public static function has($key)
    {
        return isset($_SESSION[$key]);
    }
    
    /**
     * Remove a value from the session
     * 
     * @param string $key
     * @return void
     */
    public static function remove($key)
    {
        if (isset($_SESSION[$key])) {
            unset($_SESSION[$key]);
        }
    }
    
    /**
     * Get a flash message from the session
     * 
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function flash($key, $default = null)
    {
        $value = self::get($key, $default);
        self::remove($key);
        
        return $value;
    }
    
    /**
     * Clear all session data
     * 
     * @return void
     */
    public static function clear()
    {
        session_unset();
        session_destroy();
    }
    
    /**
     * Regenerate the session ID
     * 
     * @param bool $deleteOldSession
     * @return bool
     */
    public static function regenerate($deleteOldSession = true)
    {
        return session_regenerate_id($deleteOldSession);
    }
}
