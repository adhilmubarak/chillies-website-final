package com.chillies.admin;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.util.Base64;
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

    @PluginMethod
    public void discoverPrinters(PluginCall call) {
        new Thread(() -> {
            try {
                List<String> subnets = getLocalIpSubnets();
                if (subnets.isEmpty()) {
                    call.reject("Could not determine local IP subnet. Ensure WiFi is connected.");
                    return;
                }
                
                JSArray foundPrinters = new JSArray();
                List<Thread> threads = new ArrayList<>();
                
                for (String baseIp : subnets) {
                    for (int i = 1; i < 255; i++) {
                        final String testIp = baseIp + i;
                        Thread t = new Thread(() -> {
                            try (Socket socket = new Socket()) {
                                socket.connect(new InetSocketAddress(testIp, 9100), 1000); // Increased timeout to 1s
                                synchronized (foundPrinters) {
                                    // Avoid duplicates
                                    boolean exists = false;
                                    for(int j=0; j<foundPrinters.length(); j++) {
                                        if (foundPrinters.getString(j).equals(testIp)) { exists = true; break; }
                                    }
                                    if (!exists) foundPrinters.put(testIp);
                                }
                            } catch (Exception ignored) { }
                        });
                        threads.add(t);
                        t.start();
                    }
                }
                
                for (Thread t : threads) {
                    try {
                        t.join(1200); // Wait slightly longer than socket timeout
                    } catch (Exception ignored) { }
                }
                
                JSObject result = new JSObject();
                result.put("printers", foundPrinters);
                result.put("scannedSubnets", new JSArray(subnets));
                call.resolve(result);

            } catch (Exception e) {
                call.reject("Discovery failed: " + e.getMessage());
            }
        }).start();
    }

    private List<String> getLocalIpSubnets() {
        List<String> subnets = new ArrayList<>();
        try {
            for (Enumeration<NetworkInterface> en = NetworkInterface.getNetworkInterfaces(); en.hasMoreElements();) {
                NetworkInterface intf = en.nextElement();
                // Prioritize wlan0 or eth0 interfaces
                String name = intf.getName().toLowerCase();
                
                for (Enumeration<InetAddress> enumIpAddr = intf.getInetAddresses(); enumIpAddr.hasMoreElements();) {
                    InetAddress inetAddress = enumIpAddr.nextElement();
                    if (!inetAddress.isLoopbackAddress() && inetAddress instanceof Inet4Address) {
                        String ip = inetAddress.getHostAddress();
                        int lastDot = ip.lastIndexOf('.');
                        if (lastDot > 0) {
                            String subnet = ip.substring(0, lastDot + 1);
                            if (!subnets.contains(subnet)) {
                                // Add WiFi subnets to the front
                                if (name.contains("wlan") || name.contains("eth")) {
                                    subnets.add(0, subnet);
                                } else {
                                    subnets.add(subnet);
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return subnets;
    }
}
