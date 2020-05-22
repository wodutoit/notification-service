## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start
```

## Client

open client by running client/index.html in the browser

## Azure Queue Storage
The message body is expected to be a JSON string
For example
{
	"resourcetype": "Beneficiary Status Update",
	"resourceid": "efwdbcjhwbhjw3453",
	"status": "delayed"
}

You will need to provision 3 queues for this example to work
1. beneficiary
2. incomingpayment
3. outgoingpayment
