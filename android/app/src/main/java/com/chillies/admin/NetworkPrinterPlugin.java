package com.chillies.admin;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.util.Base64;
import android.util.Log;
import java.io.OutputStream;
import java.net.Socket;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.InetAddress;
import java.net.Inet4Address;
import java.util.Enumeration;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

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
            try {
                Socket socket = new Socket();
                socket.connect(new InetSocketAddress(ip, port), 3000); 
                
                OutputStream os = socket.getOutputStream();
                byte[] bytes = Base64.decode(dataBase64, Base64.DEFAULT);
                os.write(bytes);
                os.flush();
                socket.close();
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void discoverPrinters(PluginCall call) {
        new Thread(() -> {
            try {
                List<String> subnets = getLocalIpSubnets();
                if (subnets.isEmpty()) {
                    call.reject("WiFi not connected");
                    return;
                }
                
                JSArray foundPrinters = new JSArray();
                // Use a larger thread pool for faster scanning
                ExecutorService executor = Executors.newFixedThreadPool(50);
                
                for (String baseIp : subnets) {
                    for (int i = 1; i < 255; i++) {
                        final String testIp = baseIp + i;
                        executor.execute(() -> {
                            try (Socket socket = new Socket()) {
                                // Fast timeout for discovery (400ms is usually enough on LAN)
                                socket.connect(new InetSocketAddress(testIp, 9100), 400);
                                synchronized (foundPrinters) {
                                    foundPrinters.put(testIp);
                                }
                            } catch (Exception ignored) { }
                        });
                    }
                }
                
                executor.shutdown();
                // Wait max 5 seconds for full scan
                executor.awaitTermination(5, TimeUnit.SECONDS);
                
                JSObject result = new JSObject();
                result.put("printers", foundPrinters);
                call.resolve(result);

            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        }).start();
    }

    private List<String> getLocalIpSubnets() {
        List<String> subnets = new ArrayList<>();
        try {
            for (Enumeration<NetworkInterface> en = NetworkInterface.getNetworkInterfaces(); en.hasMoreElements();) {
                NetworkInterface intf = en.nextElement();
                for (Enumeration<InetAddress> enumIpAddr = intf.getInetAddresses(); enumIpAddr.hasMoreElements();) {
                    InetAddress inetAddress = enumIpAddr.nextElement();
                    if (!inetAddress.isLoopbackAddress() && inetAddress instanceof Inet4Address) {
                        String ip = inetAddress.getHostAddress();
                        int lastDot = ip.lastIndexOf('.');
                        if (lastDot > 0) {
                            String subnet = ip.substring(0, lastDot + 1);
                            if (!subnets.contains(subnet)) subnets.add(subnet);
                        }
                    }
                }
            }
        } catch (Exception ignored) { }
        return subnets;
    }
}
