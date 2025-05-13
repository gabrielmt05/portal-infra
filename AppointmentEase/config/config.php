<?php
/**
 * Application Configuration
 * 
 * This file contains the main configuration for the application
 */

return [
    'app' => [
        'name' => getenv('APP_NAME') ?: 'Cockpit Portal',
        'url' => getenv('APP_URL') ?: 'http://localhost',
        'env' => getenv('APP_ENV') ?: 'production',
        'debug' => getenv('APP_DEBUG') === 'true',
        'key' => getenv('APP_KEY') ?: 'base64:DfmdvFFEL4P7q4vU+aIZVaKjnvIdSROfww6JfZIDyKU=',
    ],
    
    'session' => [
        'lifetime' => (int) (getenv('SESSION_LIFETIME') ?: 120),
    ],
    
    'database' => [
        'host' => getenv('PGHOST') ?: 'localhost',
        'port' => getenv('PGPORT') ?: '5432',
        'database' => getenv('PGDATABASE') ?: 'cockpit_portal',
        'username' => getenv('PGUSER') ?: 'postgres',
        'password' => getenv('PGPASSWORD') ?: 'postgres',
    ],
];
