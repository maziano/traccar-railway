FROM openjdk:17-jdk-slim

# Install wget and unzip for downloading Traccar
RUN apt-get update && apt-get install -y wget unzip && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /opt/traccar

# Download and install Traccar
RUN wget -O traccar.zip https://github.com/traccar/traccar/releases/latest/download/traccar-linux-64.zip && \
    unzip traccar.zip && \
    rm traccar.zip && \
    chmod +x tracker-server.jar

# Copy configuration files
COPY conf/ conf/

# Expose port
EXPOSE 8082

# Start Traccar
CMD ["java", "-Xms1g", "-Xmx1g", "-Djava.net.preferIPv4Stack=true", "-jar", "tracker-server.jar", "conf/traccar.xml"]