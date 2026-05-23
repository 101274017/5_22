package com.ancientencounter.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.webkit.PermissionRequest;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

/**
 * 兜底处理：在某些设备（如部分华为、ColorOS、定制 ROM 或 WebView 正在升级时），
 * Capacitor 的 isMinimumWebViewInstalled() 会因 packageInfo / versionName 为 null
 * 而抛出 NullPointerException，导致应用启动时直接闪退。
 *
 * 额外处理：
 * - WebView 的 getUserMedia / WebRTC 权限请求（扫码用的 html5-qrcode）
 * - Android 运行时相机权限申请与 WebView 权限请求的协调
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "AncientEncounter";
    private static final int CAMERA_PERMISSION_REQUEST = 100;
    private PermissionRequest pendingPermissionRequest;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        try {
            super.onCreate(savedInstanceState);
            setupCameraForWebView();
        } catch (NullPointerException npe) {
            Log.e(TAG, "WebView 初始化失败（packageInfo is null），请检查 Android System WebView", npe);
            Toast.makeText(
                this,
                "WebView 初始化失败，请到“系统设置 → 应用 → Android System WebView”确保已启用并更新",
                Toast.LENGTH_LONG
            ).show();
        } catch (Exception ex) {
            Log.e(TAG, "应用启动失败", ex);
            Toast.makeText(this, "应用启动失败：" + ex.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void setupCameraForWebView() {
        if (bridge == null || bridge.getWebView() == null) {
            Log.w(TAG, "bridge 或 webView 为空，跳过相机权限设置");
            return;
        }

        bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(bridge) {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                String[] resources = request.getResources();
                Log.d(TAG, "onPermissionRequest 被调用，资源：" + java.util.Arrays.toString(resources));

                boolean hasVideoCapture = false;
                for (String resource : resources) {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                        hasVideoCapture = true;
                        break;
                    }
                }

                if (!hasVideoCapture) {
                    // 非相机权限请求，直接授予
                    request.grant(resources);
                    return;
                }

                // 检查 Android 原生 CAMERA 权限
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                        == PackageManager.PERMISSION_GRANTED) {
                    Log.d(TAG, "Android CAMERA 权限已授予，grant WebView 权限");
                    request.grant(resources);
                } else {
                    Log.d(TAG, "Android CAMERA 权限未授予，保存 WebView 请求并申请原生权限");
                    pendingPermissionRequest = request;
                    ActivityCompat.requestPermissions(MainActivity.this,
                        new String[]{Manifest.permission.CAMERA},
                        CAMERA_PERMISSION_REQUEST);
                }
            }
        });

        // 应用启动时主动请求相机权限，避免用户首次扫码时因权限未申请而失败
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                new String[]{Manifest.permission.CAMERA},
                CAMERA_PERMISSION_REQUEST);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == CAMERA_PERMISSION_REQUEST) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "用户授予了相机权限");
                if (pendingPermissionRequest != null) {
                    pendingPermissionRequest.grant(pendingPermissionRequest.getResources());
                    pendingPermissionRequest = null;
                }
            } else {
                Log.w(TAG, "用户拒绝了相机权限——扫码功能将无法使用，需到系统设置中手动开启");
                if (pendingPermissionRequest != null) {
                    pendingPermissionRequest.deny();
                    pendingPermissionRequest = null;
                }
            }
        }
    }
}
