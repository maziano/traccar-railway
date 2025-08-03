FROM traccar/traccar:latest

# Copy custom configuration
COPY conf/traccar.xml /opt/traccar/conf/traccar.xml

# Expose port
EXPOSE 8082