<?php
/**
 * Simple PSR-4 Autoloader
 * 
 * Since we're not using Composer's autoloader in this project,
 * this file provides a simple PSR-4 compliant autoloader
 */

spl_autoload_register(function ($className) {
    // Replace namespace separator with directory separator
    $className = str_replace('\\', DIRECTORY_SEPARATOR, $className);
    
    // Define base directory for the namespace
    $baseDir = __DIR__;
    
    // Build the file path
    $file = $baseDir . DIRECTORY_SEPARATOR . $className . '.php';
    
    // If the file exists, load it
    if (file_exists($file)) {
        require_once $file;
        return true;
    }
    
    return false;
});
