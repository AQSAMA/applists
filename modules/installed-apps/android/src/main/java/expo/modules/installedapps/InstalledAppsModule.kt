package expo.modules.installedapps

import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream
import java.io.File

class InstalledAppsModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("InstalledApps")

        AsyncFunction("getInstalledApps") { includeSystemApps: Boolean, includeIcons: Boolean ->
            val context = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, Any?>>()
            val packageManager = context.packageManager
            
            val packages = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packageManager.getInstalledPackages(PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                packageManager.getInstalledPackages(0)
            }
            
            packages.mapNotNull { packageInfo ->
                try {
                    val appInfo = packageInfo.applicationInfo ?: return@mapNotNull null
                    val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                    
                    if (!includeSystemApps && isSystemApp) {
                        return@mapNotNull null
                    }
                    
                    val appName = packageManager.getApplicationLabel(appInfo).toString()
                    val packageName = packageInfo.packageName
                    val versionName = packageInfo.versionName ?: "Unknown"
                    val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        packageInfo.longVersionCode
                    } else {
                        @Suppress("DEPRECATION")
                        packageInfo.versionCode.toLong()
                    }
                    
                    val apkSize = try {
                        val sourceDir = appInfo.sourceDir
                        if (sourceDir != null) File(sourceDir).length() else 0L
                    } catch (e: Exception) {
                        0L
                    }
                    
                    val installTime = packageInfo.firstInstallTime
                    val lastUpdateTime = packageInfo.lastUpdateTime
                    val minSdk = appInfo.minSdkVersion
                    val targetSdk = appInfo.targetSdkVersion
                    
                    val iconBase64 = if (includeIcons) {
                        try {
                            val drawable = packageManager.getApplicationIcon(appInfo)
                            drawableToBase64(drawable)
                        } catch (e: Exception) {
                            null
                        }
                    } else {
                        null
                    }
                    
                    mapOf(
                        "title" to appName,
                        "packageName" to packageName,
                        "version" to versionName,
                        "versionCode" to versionCode,
                        "isSystem" to isSystemApp,
                        "apkSize" to apkSize,
                        "installTime" to installTime,
                        "lastUpdateTime" to lastUpdateTime,
                        "minSDK" to minSdk,
                        "targetSDK" to targetSdk,
                        "icon" to iconBase64
                    )
                } catch (e: Exception) {
                    null
                }
            }
        }

        AsyncFunction("getAppIcon") { packageName: String ->
            val context = appContext.reactContext ?: return@AsyncFunction null
            val packageManager = context.packageManager
            
            try {
                val appInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    packageManager.getApplicationInfo(packageName, PackageManager.ApplicationInfoFlags.of(0))
                } else {
                    @Suppress("DEPRECATION")
                    packageManager.getApplicationInfo(packageName, 0)
                }
                val drawable = packageManager.getApplicationIcon(appInfo)
                drawableToBase64(drawable)
            } catch (e: Exception) {
                null
            }
        }

        Function("isAppInstalled") { packageName: String ->
            val context = appContext.reactContext ?: return@Function false
            val packageManager = context.packageManager
            
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    packageManager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
                } else {
                    @Suppress("DEPRECATION")
                    packageManager.getPackageInfo(packageName, 0)
                }
                true
            } catch (e: PackageManager.NameNotFoundException) {
                false
            }
        }

        AsyncFunction("getAppDetails") { packageName: String ->
            val context = appContext.reactContext ?: return@AsyncFunction null
            val packageManager = context.packageManager
            
            try {
                val packageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    packageManager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
                } else {
                    @Suppress("DEPRECATION")
                    packageManager.getPackageInfo(packageName, 0)
                }
                
                val appInfo = packageInfo.applicationInfo ?: return@AsyncFunction null
                val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                val appName = packageManager.getApplicationLabel(appInfo).toString()
                val versionName = packageInfo.versionName ?: "Unknown"
                val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    packageInfo.longVersionCode
                } else {
                    @Suppress("DEPRECATION")
                    packageInfo.versionCode.toLong()
                }
                
                val apkSize = try {
                    val sourceDir = appInfo.sourceDir
                    if (sourceDir != null) File(sourceDir).length() else 0L
                } catch (e: Exception) {
                    0L
                }
                
                val iconBase64 = try {
                    val drawable = packageManager.getApplicationIcon(appInfo)
                    drawableToBase64(drawable)
                } catch (e: Exception) {
                    null
                }
                
                mapOf(
                    "title" to appName,
                    "packageName" to packageName,
                    "version" to versionName,
                    "versionCode" to versionCode,
                    "isSystem" to isSystemApp,
                    "apkSize" to apkSize,
                    "installTime" to packageInfo.firstInstallTime,
                    "lastUpdateTime" to packageInfo.lastUpdateTime,
                    "minSDK" to appInfo.minSdkVersion,
                    "targetSDK" to appInfo.targetSdkVersion,
                    "icon" to iconBase64
                )
            } catch (e: Exception) {
                null
            }
        }
    }
    
    private fun drawableToBase64(drawable: Drawable): String {
        val bitmap = drawableToBitmap(drawable)
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
        val bytes = outputStream.toByteArray()
        return Base64.encodeToString(bytes, Base64.NO_WRAP)
    }
    
    private fun drawableToBitmap(drawable: Drawable): Bitmap {
        if (drawable is BitmapDrawable && drawable.bitmap != null) {
            return drawable.bitmap
        }
        
        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 48
        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 48
        
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }
}
