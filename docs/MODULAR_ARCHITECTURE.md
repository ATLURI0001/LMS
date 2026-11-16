# Multi-Stack Modular Service Boundaries Specification

## Architecture Overview
The Learning Management System integrates three decoupled runtime stacks:
1. **Java Enterprise Service**: Core academic grading, transcript auditing, and transactional record ledger.
2. **Python Data Engine**: Recommendation engine, automated quiz generation, and plagiarism analysis.
3. **MERN Client & Course Delivery**: Real-time collaborative classroom, video streaming, and student interface.

## Inter-Service Communication
Services communicate via asynchronous gRPC and RabbitMQ event buses with protobuf schema contracts.
