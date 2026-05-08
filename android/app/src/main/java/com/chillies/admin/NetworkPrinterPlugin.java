package com.chillies.admin;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.util.Base64;
import java.io.OutputStream;
import java.net.Socket;

@CapacitorPlugin(name = "NetworkPrinter")
public class NetworkPrinterPlugin extends Plugin {

    @PluginMethod
    public void print(PluginCall call) {
        String ip = call.getString("ip");
        Integer port = call.getInt("port", 9100);
        String dataBase64 = call.getString("data");

        if (ip == null || dataBase64 == null) {
            call.reject("Must provide IP and base64 data");
            return;
        }

        new Thread(() -> {
            try (Socket socket = new Socket(ip, port)) {
                OutputStream os = socket.getOutputStream();
                byte[] bytes = Base64.decode(dataBase64, Base64.DEFAULT);
                os.write(bytes);
                os.flush();
                call.resolve();
            } catch (Exception e) {
                call.reject("Error printing to " + ip + ": " + e.getMessage());
            }
        }).start();
    }
}
