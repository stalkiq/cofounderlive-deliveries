# Durable memory

This app uses POST/GET `/api/memory`.

Inside Cofounder Live preview, those routes are hosted against Firestore so saves survive refresh.
In a standalone deploy, wire the same routes to your database.
