FROM maven:3.9.11-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B -DskipTests package
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S ascent && adduser -S ascent -G ascent && mkdir -p /data && chown ascent:ascent /data
COPY --from=build /app/target/ascent-lms-1.0.0.jar app.jar
USER ascent
EXPOSE 8000
CMD ["java", "-jar", "app.jar"]
