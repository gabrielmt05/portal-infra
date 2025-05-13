<?php
/**
 * Main entry point for Cockpit Portal application
 * 
 * This file serves as the front controller for the application
 * It bootstraps the application by loading required files and handling requests
 */

// Start session
session_start();

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Process valid lines
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            
            // Remove quotes if present
            if (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            }
            
            putenv("$name=$value");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Define base path constants
define('BASE_PATH', __DIR__);
define('CONFIG_PATH', BASE_PATH . '/config');
define('SRC_PATH', BASE_PATH . '/src');
define('PUBLIC_PATH', BASE_PATH . '/public');
define('VIEW_PATH', SRC_PATH . '/Views');

// Import autoloader
require_once __DIR__ . '/autoload.php';

// Import router utility
use Src\Utilities\Router;

// Define routes
// Auth routes
Router::get('/', 'AuthController@showLogin');
Router::post('/login', 'AuthController@login');
Router::get('/logout', 'AuthController@logout');

// Dashboard route
Router::get('/dashboard', 'DashboardController@index');

// User routes
Router::get('/users', 'UserController@index');
Router::get('/users/create', 'UserController@create');
Router::post('/users/store', 'UserController@store');
Router::get('/users/edit/{id}', 'UserController@edit');
Router::post('/users/update/{id}', 'UserController@update');
Router::get('/users/delete/{id}', 'UserController@delete');

// Server routes
Router::get('/servers', 'ServerController@index');
Router::get('/servers/create', 'ServerController@create');
Router::post('/servers/store', 'ServerController@store');
Router::get('/servers/edit/{id}', 'ServerController@edit');
Router::post('/servers/update/{id}', 'ServerController@update');
Router::get('/servers/delete/{id}', 'ServerController@delete');
Router::get('/servers/access/{id}', 'ServerController@access');

// Dispatch the route
Router::dispatch();
