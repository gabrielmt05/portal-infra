<?php
namespace Src\Utilities;

/**
 * Router Utility
 * 
 * Simple router to handle URL routing
 */
class Router
{
    /**
     * Routes collection
     *
     * @var array
     */
    private static $routes = [];
    
    /**
     * Register a GET route
     *
     * @param string $path
     * @param string $handler
     * @return void
     */
    public static function get($path, $handler)
    {
        self::$routes[] = [
            'method' => 'GET',
            'path' => $path,
            'handler' => $handler
        ];
    }
    
    /**
     * Register a POST route
     *
     * @param string $path
     * @param string $handler
     * @return void
     */
    public static function post($path, $handler)
    {
        self::$routes[] = [
            'method' => 'POST',
            'path' => $path,
            'handler' => $handler
        ];
    }
    
    /**
     * Dispatch the current request
     *
     * @return void
     */
    public static function dispatch()
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        foreach (self::$routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }
            
            $pattern = self::buildPatternFromPath($route['path']);
            
            if (preg_match($pattern, $uri, $matches)) {
                // Remove the full match
                array_shift($matches);
                
                // Extract controller and method
                list($controller, $method) = explode('@', $route['handler']);
                
                // Add namespace prefix if not present
                if (strpos($controller, '\\') === false) {
                    $controller = 'Src\\Controllers\\' . $controller;
                }
                
                // Instantiate controller and call method
                $controllerInstance = new $controller();
                call_user_func_array([$controllerInstance, $method], $matches);
                
                return;
            }
        }
        
        // No route matched - show 404
        header('HTTP/1.0 404 Not Found');
        echo '404 - Page not found';
        exit;
    }
    
    /**
     * Build a regex pattern from a route path
     *
     * @param string $path
     * @return string
     */
    private static function buildPatternFromPath($path)
    {
        // Replace {param} with a capture group
        $pattern = preg_replace('/{([a-zA-Z0-9_]+)}/', '([^/]+)', $path);
        
        // Escape forward slashes and add delimiters
        $pattern = '#^' . $pattern . '$#';
        
        return $pattern;
    }
}
