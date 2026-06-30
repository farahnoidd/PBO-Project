FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /build

COPY app/pom.xml .
COPY app/src ./src

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]