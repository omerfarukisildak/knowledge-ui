# Modüller

Her feature kendi klasöründe yaşar: `src/modules/<modul-adi>/`. `sdp-ui` ile aynı düzen:

```
src/modules/<modul-adi>/
├── api/          # backend çağrıları (server action ya da /api route'una fetch)
├── components/   # modüle özel bileşenler
├── contexts/     # modül state'i
├── hooks/
└── types/
```

Yeni bir modül eklerken sırayla:

1. `src/contexts/module-context/module-permission-defaults.ts` → `ModulePermissionResponse` alanı
2. `src/contexts/module-context/services.ts` → backend yanıtındaki alanın eşlenmesi
3. `src/components/app-shell/module-registry.ts` → `MODULE_PRIORITY` + `moduleNavConfig` girdisi
4. `src/paths.ts` → route sabitleri
5. `src/app/(authenticatedPages)/<modul-adi>/` → sayfalar, `withModulePermission` ile sarılmış
6. `src/i18n/locales/{tr,en}.json` → menü ve sayfa metinleri
