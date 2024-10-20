<?php
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

require __DIR__ . '/vendor/autoload.php';

class Chat implements MessageComponentInterface {
    protected $clients;
    protected $users;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->users = [];
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        
        switch($data['type']) {
            case 'register':
                $this->users[$data['username']] = $from;
                $from->username = $data['username'];
                break;
            case 'search':
                $result = array_filter(array_keys($this->users), function($username) use ($data) {
                    return stripos($username, $data['query']) !== false;
                });
                $from->send(json_encode(['type' => 'searchResult', 'result' => array_values($result)]));
                break;
            case 'message':
                if (isset($this->users[$data['to']])) {
                    $this->users[$data['to']]->send(json_encode([
                        'type' => 'message',
                        'from' => $from->username,
                        'content' => $data['content']
                    ]));
                }
                break;
        }
    }

    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
        if (isset($conn->username)) {
            unset($this->users[$conn->username]);
        }
        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }
}

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new Chat()
        )
    ),
    8080
);

$server->run();
