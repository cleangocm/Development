import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val keyProperties = Properties()
val keyPropertiesFile = rootProject.file("key.properties")
if (keyPropertiesFile.exists()) {
    FileInputStream(keyPropertiesFile).use(keyProperties::load)
}

fun signingValue(propertyName: String, environmentName: String): String? {
    return keyProperties.getProperty(propertyName)?.takeIf { it.isNotBlank() }
        ?: System.getenv(environmentName)?.takeIf { it.isNotBlank() }
}

val releaseStoreFile = signingValue("storeFile", "CLEANGO_UPLOAD_STORE_FILE")
val releaseStorePassword =
    signingValue("storePassword", "CLEANGO_UPLOAD_STORE_PASSWORD")
val releaseKeyAlias = signingValue("keyAlias", "CLEANGO_UPLOAD_KEY_ALIAS")
val releaseKeyPassword =
    signingValue("keyPassword", "CLEANGO_UPLOAD_KEY_PASSWORD")
val hasReleaseSigning =
    listOf(
        releaseStoreFile,
        releaseStorePassword,
        releaseKeyAlias,
        releaseKeyPassword,
    ).all { !it.isNullOrBlank() }
val releaseTaskRequested =
    gradle.startParameter.taskNames.any { it.contains("release", ignoreCase = true) }

if (releaseTaskRequested && !hasReleaseSigning) {
    throw GradleException(
        "CLEANGO release signing is not configured. Provide android/key.properties " +
            "or CLEANGO_UPLOAD_STORE_FILE, CLEANGO_UPLOAD_STORE_PASSWORD, " +
            "CLEANGO_UPLOAD_KEY_ALIAS, and CLEANGO_UPLOAD_KEY_PASSWORD.",
    )
}

android {
    namespace = "com.cleangocm.app"
    compileSdk = 36
    ndkVersion = "28.2.13676358"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    defaultConfig {
        applicationId = "com.cleangocm.app"
        ndk {
            abiFilters += listOf("armeabi-v7a", "arm64-v8a", "x86_64")
        }
        minSdk = flutter.minSdkVersion
        targetSdk = 36
        versionCode = 2
        versionName = "1.0.0"
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(releaseStoreFile!!)
                storePassword = releaseStorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        release {
            signingConfig =
                if (hasReleaseSigning) signingConfigs.getByName("release") else null
        }
    }
}

flutter {
    source = "../.."
}
