# n8-BigStats

<img align="right" width="150px" src="BigStats-300dpi.png" alt="BigStats_Logo"/>

Push BIG-IP stats to remote logging services. Supports http, https, statsd, and Apache Kafka destinations.

1. Install the RPM in /DIST to your BIG-IP.
2. Configure the destination

## Install

1. Download the latest BigStats RPM from the `/DIST` directory here: https://github.com/npearce/n8-BigStats It's name will be something like (numbers may differ): `BigStats-0.4.0-0002.noarch.rpm`
2. Copy (scp) the BigStats RPM into the following directory on your BIG-IP: `/var/config/rest/downloads/`
3. Execute the following command on your BIG-IP (shell prompt, not tmsh) to install:

```sh
curl -u <username>:<password> -X POST http://localhost:8100/mgmt/shared/iapp/package-management-tasks -d '{ "operation":"INSTALL","packageFilePath": "/var/config/rest/downloads/n8-BigStats-0.4.0-0002.noarch.rpm"}'
```

NOTE: Use your admin username/password and check the name of the RPM carefaully as release numbers may differ from the example above.

The response will look something like this:

```json
{"packageFilePath":"/var/config/rest/downloads/BigStats-0.4.0-0002.noarch.rpm","operation":"INSTALL","id":"fa13463f-6556-44cc-a699-7a7981dcc295","status":"CREATED","userReference":{"link":"https://localhost/mgmt/shared/authz/users/admin"},"identityReferences":[{"link":"https://localhost/mgmt/shared/authz/users/admin"}],"ownerMachineId":"3ed07ac1-8c3e-43c5-aacf-53eebf4cb2f8","generation":1,"lastUpdateMicros":1524932793810249,"kind":"shared:iapp:package-management-tasks:iapppackagemanagementtaskstate","selfLink":"https://localhost/mgmt/shared/iapp/package-management-tasks/fa13463f-6556-44cc-a699-7a7981dcc295"}
```

4. [OPTIONAL] Using the 'id' value in the response above, you can confirm the installation results like this (using your own unique job id):

`curl -u <username>:<password> -X GET http://localhost:8100/mgmt/shared/iapp/package-management-tasks/fa13463f-6556-44cc-a699-7a7981dcc295`

The response will look something like this:

```json
{"packageFilePath":"/var/config/rest/downloads/BigStats-0.4.0-0002.noarch.rpm","packageName":"n8-BigStats-0.4.0-0002.noarch","operation":"INSTALL","packageManifest":{"tags":["IAPP"]},"id":"fa13463f-6556-44cc-a699-7a7981dcc295","status":"FINISHED","startTime":"2018-04-28T09:26:33.818-0700","endTime":"2018-04-28T09:26:34.711-0700","userReference":{"link":"https://localhost/mgmt/shared/authz/users/admin"},"identityReferences":[{"link":"https://localhost/mgmt/shared/authz/users/admin"}],"ownerMachineId":"3ed07ac1-8c3e-43c5-aacf-53eebf4cb2f8","generation":3,"lastUpdateMicros":1524932794714759,"kind":"shared:iapp:package-management-tasks:iapppackagemanagementtaskstate","selfLink":"https://localhost/mgmt/shared/iapp/package-management-tasks/fa13463f-6556-44cc-a699-7a7981dcc295"}
```

Note the `"status":"FINISHED"` indicating that installation was successful.

## Configure

To configure, POST settings to `/mgmt/shared/bigstats_settings`:

The BigStats Configuration Schema is located here: `SRC/bigstats-schema.json`

* **protocol:** [http|https|statsd|kafka]
* **address** ip address or resolvable domain name
* **port** destination tcp port
* **uri** [OPTIONAL] End-point to post data to. Can be blank. Used only for http or https destinations.
* **interval** - how often, in seconds, to send the stats. Default: 10 seconds.
* **debug** - this will put a LOT of data into the BIG-IPs `/var/log/restnoded/restnoded.log`. Remember to turn this off when done.

### Example comnfigurations

**HTTP destination:**

`POST https://{{mgmt_ip_address}}/mgmt/shared/bigstats_settings`

```json
{
    "config": {
        "destination": {
          "protocol": "http",
          "address": "192.168.1.42",
          "port": "8080",
          "uri": "/stats"
        },
        "size": "small",
        "interval": "10",
        "debug": false
      }
}
```

**StatsD destination:**

NOTE: This functionality uses https://github.com/sivy/node-statsd 

`POST https://{{mgmt_ip_address}}/mgmt/shared/n8/bigstats_settings`

```json
{
    "config": {
        "destination": {
          "protocol": "statsd",
          "address": "192.168.1.42",
          "port": "8125"
        },
        "size": "small",
        "interval": "10",
        "debug": false
      }
}
```

> NOTE: To build your own StatsD/GraphiteDB/Grafana lab environment, refer to `DOCS/LAB_SETUP.md`

**Kafka Message Bus Destination:**

NOTE: This functionality uses https://github.com/SOHU-Co/kafka-node

`POST https://{{mgmt_ip_address}}/mgmt/shared/n8/bigstats_settings`

```json
{
    "config": {
        "destination": {
          "protocol": "kafka",
          "kafka": {
                  "topic": "partition"
          },
          "address": "172.31.1.42",
          "port": "9092"
        },
        "size": "small",
        "interval": "10",
        "debug": false
      }
}
```

> NOTE: To build your own Apache Kafka Broker lab environment, refer to `DOCS/LAB_SETUP.md`

Depending on your configuration above (`'topic': 'all'` or `'topic': 'partition'`) BigStats will put all the stats into one kafka topic, or create seperate topics per BIG-IP Administrative Partition.

Dependong on your Apache Kafka Borker implementation, viewing the list of Kafka Topics might look like this:

```sh
/ # kafka-topics.sh --list --zookeeper zookeeper
Common
Tenant_01-App1
Tenant_02-App2
Tenant_03-App3
```

And viewing the contents of a Kafka Topic Kafka for sample BIG-IP Administrative partition `Tenant_01-App1` looks like:

```sh
/ # kafka-simple-consumer-shell.sh --broker-list localhost:9092 --topic Tenant_01-App1
{"vip":{"clientside_curConns":0,"clientside_maxConns":6,"clientside_bitsIn":668184240,"clientside_bitsOut":37371977200,"clientside_pktsIn":1500027,"clientside_pktsOut":2031911},"pool":{"serverside_curConns":0,"serverside_maxConns":9,"serverside_bitsIn":537711552,"serverside_bitsOut":36314664160,"serverside_pktsIn":1270792,"serverside_pktsOut":2353845}}
```

**Example BigStats http output:**

```http

POST /stats HTTP/1.1
Content-Type: application/json
Cache-Control: no-cache
Host: 192.168.1.42:8080
Connection: keep-alive
Transfer-Encoding: chunked

{
        "Common": {
                "/Common/172.31.4.200:80": {
                        "clientside_curConns": 0,
                        "clientside_maxConns": 0,
                        "clientside_bitsIn": 0,
                        "clientside_bitsOut": 0,
                        "clientside_pktsIn": 0,
                        "clientside_pktsOut": 0,
                        "/Common/noAS3_POOL": [
                                {
                                        "172.31.10.200:8080": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                },
                                {
                                        "172.31.10.201:8080": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                },
                                {
                                        "172.31.10.202:8080": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                }
                        ]
                }
        },
        "Tenant_02/App2": {
                "/Tenant_02/App2/172.31.4.21:443": {
                        "clientside_curConns": 0,
                        "clientside_maxConns": 0,
                        "clientside_bitsIn": 0,
                        "clientside_bitsOut": 0,
                        "clientside_pktsIn": 0,
                        "clientside_pktsOut": 0,
                        "/Tenant_02/App2/web_pool2": [
                                {
                                        "172.31.4.120:80": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                },
                                {
                                        "172.31.4.121:80": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                },
                                {
                                        "172.31.4.122:80": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                },
                                {
                                        "172.31.4.123:80": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                }
                        ]
                }
        },
        "Tenant_01/App1": {
                "/Tenant_01/App1/172.31.4.11:80": {
                        "clientside_curConns": 0,
                        "clientside_maxConns": 0,
                        "clientside_bitsIn": 0,
                        "clientside_bitsOut": 0,
                        "clientside_pktsIn": 0,
                        "clientside_pktsOut": 0,
                        "/Tenant_01/App1/web_pool1": [
                                {
                                        "172.31.10.112:80": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                },
                                {
                                        "172.31.10.111:80": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                },
                                {
                                        "172.31.10.113:80": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                },
                                {
                                        "172.31.10.114:80": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                }
                        ]
                }
        },
        "Tenant_03/App3": {
                "/Tenant_03/App3/172.31.4.31:80": {
                        "clientside_curConns": 0,
                        "clientside_maxConns": 0,
                        "clientside_bitsIn": 0,
                        "clientside_bitsOut": 0,
                        "clientside_pktsIn": 0,
                        "clientside_pktsOut": 0,
                        "/Tenant_03/App3/web_pool3": [
                                {
                                        "172.31.10.132:80": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                },
                                {
                                        "172.31.10.131:80": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                },
                                {
                                        "172.31.10.134:80": {
                                                "serverside_curConns": 0,
                                                "serverside_maxConns": 0,
                                                "serverside_bitsIn": 0,
                                                "serverside_bitsOut": 0,
                                                "serverside_pktsIn": 0,
                                                "serverside_pktsOut": 0,
                                                "monitorStatus": "down"
                                        }
                                }
                        ]
                }
        }
}
```