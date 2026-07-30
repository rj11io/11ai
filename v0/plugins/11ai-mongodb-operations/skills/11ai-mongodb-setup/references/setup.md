# MongoDB setup reference

## Client tools

The shell and the Database Tools are separate packages.

macOS:

```bash
brew tap mongodb/brew
brew install mongosh
brew install mongodb-database-tools
```

Debian or Ubuntu, from MongoDB's own repository so the version is current:

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc \
  | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" \
  | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt-get update
sudo apt-get install -y mongodb-mongosh mongodb-database-tools
```

```bash
mongosh --version
mongodump --version
```

The tools version should be at or above the server version. An older `mongodump` against a newer server can fail on collection options it does not recognise.

## Local single server, in Docker

```bash
docker run -d --name mongo \
  -p 27017:27017 \
  -v mongo-data:/data/db \
  mongo:8
```

Without `-v mongo-data:/data/db` the data lives inside the container and is destroyed with it. Removing the volume later is destructive and needs explicit approval:

```bash
docker volume rm mongo-data
```

With authentication enabled, which is closer to production:

```bash
docker run -d --name mongo \
  -p 27017:27017 \
  -v mongo-data:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=devpassword \
  mongo:8
```

Those environment variables apply only on first initialisation of an empty volume. Changing them later has no effect, which is a common source of confusion when a password seems to be ignored.

## Local single-node replica set

Required for transactions and change streams. A standalone server rejects both.

```yaml
# compose.yaml
services:
  mongo:
    image: mongo:8
    command: ["--replSet", "rs0", "--bind_ip_all"]
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping')"]
      interval: 5s
      retries: 10

volumes:
  mongo-data:
```

```bash
docker compose up -d
docker compose exec mongo mongosh --quiet --eval 'rs.initiate({_id: "rs0", members: [{_id: 0, host: "localhost:27017"}]})'
docker compose exec mongo mongosh --quiet --eval 'rs.status().ok'
```

Initiate once. Running it again on an initialised set returns an already-initialised error, which is harmless.

Connect with the set named, and with direct connection so the client does not try to resolve a host the container advertises:

```text
mongodb://localhost:27017/app?replicaSet=rs0&directConnection=true
```

## Local server via package manager

```bash
brew tap mongodb/brew
brew install mongodb-community@8.0
brew services start mongodb-community@8.0
```

```bash
brew services list
```

A package-managed server starts without authentication and listens on localhost. That is acceptable for local development and unacceptable on any shared machine; enable authentication before binding to a non-local address.

## Atlas

Account-side work, not an installation. Four steps:

1. **Create the cluster** in the intended project and region. Match the version to production.
2. **Create a database user** with the narrowest role the application needs — usually `readWrite` on one database. Never give an application an account-wide administrative role.
3. **Add a network access rule** for the current address:

   ```bash
   curl -s https://checkip.amazonaws.com
   ```

   Do not add `0.0.0.0/0`. It exposes the cluster to the whole internet with only the password in the way. For a pipeline or a serverless platform whose addresses are not fixed, use the provider's private networking or the platform's documented integration instead.
4. **Get the connection string** from the cluster's connect dialog and store it in an ignored environment file.

The Atlas CLI does the same steps without a browser:

```bash
atlas auth login
atlas clusters list
atlas dbusers create --username APP_USER --role readWrite@app --projectId PROJECT_ID
atlas accessLists create --currentIp --projectId PROJECT_ID
```

`atlas dbusers create` prompts for a password rather than taking it as an argument. Let it prompt; a password in an argument is recorded in shell history and in the process list.

## Connection strings

Standard, for a known host list:

```text
mongodb://USER:PASSWORD@host1:27017,host2:27017/app?replicaSet=rs0&authSource=admin&retryWrites=true&w=majority
```

DNS seed list, which is what Atlas gives and which resolves the member list at connect time:

```text
mongodb+srv://USER:PASSWORD@cluster0.abcde.mongodb.net/app?retryWrites=true&w=majority
```

The parts that cause most failures:

- **Percent-encode the password.** `@ : / ? # [ ] %` must be encoded. An unencoded `@` splits the string at the wrong place and the error names the host, not the password.
- **Name the database** after the host, or the driver connects to `test` and every query silently reads an empty collection.
- **`authSource`** names the database holding the user, which is usually `admin` and is not the application database. A wrong `authSource` reads as bad credentials.
- **`replicaSet`** for a set, so a failover is handled instead of leaving the client on a former primary.
- **`retryWrites=true`** and **`w=majority`** for durability against a failover.
- **`mongodb+srv`** cannot carry a port. Adding one is a parse error.

Store it where it stays out of the repository:

```text
# .env.local, which must be listed in .gitignore
MONGODB_URI=mongodb+srv://...
```

```bash
grep -q '^\.env' .gitignore && echo "env files ignored"
grep -c MONGODB_URI .env.local
```

Confirm with a count, never by printing the value.

## Verify

```bash
mongosh "$MONGODB_URI" --quiet --eval 'printjson({ db: db.getName(), setName: db.hello().setName, version: db.version() })'
```

```bash
mongosh "$MONGODB_URI" --quiet --eval 'printjson(db.runCommand({ connectionStatus: 1 }).authInfo)'
```

```bash
mongosh "$MONGODB_URI" --quiet --eval 'db.getCollectionNames()'
```

In order: the server answers, the default database is the intended one, the granted roles are the narrow ones expected, and the account can actually list collections. Reachability and authorisation are different things, and only the last command tests the second one.

For a transaction-dependent application, confirm the set is usable:

```bash
mongosh "$MONGODB_URI" --quiet --eval 'printjson(db.hello().setName ?? "standalone: transactions unavailable")'
```

## Cleanup

```bash
docker rm -f mongo
docker volume rm mongo-data
```

```bash
brew services stop mongodb-community@8.0
```

Removing the volume deletes the data. Check what is in it first, and get approval for the exact volume name.
