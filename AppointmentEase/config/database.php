<?php
/**
 * Database Configuration
 * 
 * This file handles the database connection setup
 */

$config = require_once __DIR__ . '/config.php';

return [
    'driver' => 'pgsql',
    'host' => $config['database']['host'],
    'port' => $config['database']['port'],
    'database' => $config['database']['database'],
    'username' => $config['database']['username'],
    'password' => $config['database']['password'],
    'charset' => 'utf8',
    'prefix' => '',
    'schema' => 'public',
    'sslmode' => 'prefer',
];
